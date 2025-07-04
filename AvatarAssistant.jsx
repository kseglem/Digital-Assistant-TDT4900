import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  sendChatMessage,
  sendSpeechToText,
  getTextToSpeech,
} from "../../api/apiController";
import "../../styles/Components/Avatar/avatar.css";

const ANIM_SPEED = 0.4;
const VAR_COUNT = 8;
const MODEL_URL =
  "https://models.readyplayer.me/67ec47310f53cce37adfca5f.glb";

const idleUrls = Array.from({ length: VAR_COUNT }, (_, i) =>
  `/animations/idle/F_Standing_Idle_Variations_00${i + 1}.glb`
);
const talkUrls = Array.from({ length: VAR_COUNT }, (_, i) =>
  `/animations/talk/F_Talking_Variations_00${i + 1}.glb`
);

const AvatarModel = memo(
  function AvatarModel({ speaking, mouthRef }) {
    const group = useRef();
    const idleTimer = useRef();
    const talkTimer = useRef();
    const curIdle = useRef({ idx: -1, action: null });
    const curTalk = useRef({ idx: -1, action: null });

    const { scene } = useGLTF(MODEL_URL);
    const idleGltfs = useLoader(GLTFLoader, idleUrls);
    const talkGltfs = useLoader(GLTFLoader, talkUrls);

    const idleClips = useMemo(() => idleGltfs.flatMap((g) => g.animations), [idleGltfs]);
    const talkClips = useMemo(() => talkGltfs.flatMap((g) => g.animations), [talkGltfs]);

    const { actions, mixer } = useAnimations([...idleClips, ...talkClips], group);
    mixer.timeScale = ANIM_SPEED;

    const randomIdx = (current) => {
      let n;
      do n = Math.floor(Math.random() * VAR_COUNT);
      while (n === current);
      return n;
    };

    const crossFade = (from, to, dur = 0.5) => {
      from && to ? from.crossFadeTo(to, dur, true) : to.fadeIn(dur);
    };

    const playIdle = useCallback(
      (idx) => {
        if (idx === curIdle.current.idx) return;
        const next = actions[idleClips[idx].name];
        if (!next) return;
        next.enabled = true;
        next.time = 0;
        next.setEffectiveWeight(1);
        crossFade(curTalk.current.action || curIdle.current.action, next, 0.8);
        next.play();
        curIdle.current = { idx, action: next };
      },
      [actions, idleClips]
    );

    const playTalk = useCallback(
      (idx) => {
        if (idx === curTalk.current.idx) return;
        const next = actions[talkClips[idx].name];
        if (!next) return;
        next.enabled = true;
        next.time = 0;
        next.setLoop(THREE.LoopRepeat);
        next.setEffectiveWeight(0.9);
        crossFade(curTalk.current.action || curIdle.current.action, next, 0.6);
        next.play();
        curTalk.current = { idx, action: next };
      },
      [actions, talkClips]
    );

    const scheduleIdle = useCallback(() => {
      clearTimeout(idleTimer.current);
      const idx = randomIdx(curIdle.current.idx);
      playIdle(idx);
      const half = idleClips[idx].duration / ANIM_SPEED / 2;
      idleTimer.current = setTimeout(scheduleIdle, Math.max(0, half * 1000 - 400));
    }, [idleClips, playIdle]);

    const scheduleTalk = useCallback(() => {
      clearTimeout(talkTimer.current);
      const idx = randomIdx(curTalk.current.idx);
      playTalk(idx);
      const half = talkClips[idx].duration / ANIM_SPEED / 2;
      talkTimer.current = setTimeout(scheduleTalk, Math.max(0, half * 1000 - 400));
    }, [talkClips, playTalk]);

    useEffect(() => {
      speaking ? scheduleTalk() : scheduleIdle();
      return () => {
        clearTimeout(idleTimer.current);
        clearTimeout(talkTimer.current);
      };
    }, [speaking, scheduleIdle, scheduleTalk]);

    useFrame((_, delta) => {
      mixer.update(delta);
      scene.traverse((obj) => {
        if (!obj.isMesh || !obj.morphTargetDictionary) return;
        const idx = obj.morphTargetDictionary["mouthOpen"];
        if (idx === undefined || !obj.morphTargetInfluences) return;
        const cur = obj.morphTargetInfluences[idx] ?? 0;
        obj.morphTargetInfluences[idx] = THREE.MathUtils.lerp(cur, mouthRef.current, 0.4);
      });
    });

    return <primitive ref={group} object={scene} />;
  },
  (prev, next) => prev.speaking === next.speaking 
);

export default function AvatarAssistant({ bearerToken, selectedModel, messages, setMessages, showSubtitles }) {
  const [listening, setListening] = useState(false);
  const [speaking,  setSpeaking]  = useState(false);
  const [thinking,  setThinking]  = useState(false);
  const [subtitle,  setSubtitle]  = useState("");

  const mouthRef      = useRef(0); 
  const listenFlag    = useRef(false);
  const mediaRecorder = useRef(null);
  const audioChunks   = useRef([]);

  const buildCtx = (arr) =>
    arr.slice(-4).map((m) => `${m.type === "outgoing" ? "User" : "Assistant"}: ${m.text}`).join("\n");

  const chat = useCallback(
    async (text) => {
      const outMsg = { id: Date.now(), text, type: "outgoing" };
      setMessages((prev) => [...prev, outMsg]);

      const reply = await sendChatMessage(
        bearerToken,
        text,
        buildCtx([...messages, outMsg]),
        selectedModel.apiName
      );

      setMessages((prev) => [...prev, { id: Date.now() + 1, text: reply, type: "incoming" }]);
      setSubtitle(reply);

      const src = await getTextToSpeech(bearerToken, reply, "nova");
      if (!src) return;

      setSpeaking(true);
      const audio = new Audio(src);
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      audioCtx.createMediaElementSource(audio).connect(analyser);
      analyser.connect(audioCtx.destination);

      const buffer = new Uint8Array(analyser.fftSize);
      let playing = true;

      const tick = () => {
        if (!playing) return;
        analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128;
          sum += v * v;
        }
        const rms   = Math.sqrt(sum / buffer.length);
        const weight = Math.min(1, Math.max(0, (rms - 0.002) * 8));
        mouthRef.current = weight;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      audio.onended = () => {
        playing = false;
        mouthRef.current = 0;
        setSpeaking(false);
        audioCtx.close();
      };

      setThinking(false);
      audio.play();
    },
    [bearerToken, selectedModel.apiName, messages, setMessages]
  );

  const stopRec = () => {
    const r = mediaRecorder.current;
    if (r && r.state !== "inactive") r.stop();
  };

  const startRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    audioChunks.current = [];

    rec.ondataavailable = (e) => e.data.size && audioChunks.current.push(e.data);
    rec.onstop = async () => {
      setThinking(true);
      rec.stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      audioChunks.current = [];
      const transcript = await sendSpeechToText(bearerToken, blob, "default");
      if (transcript) await chat(transcript);
    };

    mediaRecorder.current = rec;
    rec.start();
  };

  useEffect(() => {
    const down = (e) => {
      if (e.code !== "Space" || listenFlag.current) return;
      e.preventDefault();
      listenFlag.current = true;
      setListening(true);
      startRec();
    };
    const up = (e) => {
      if (e.code !== "Space" || !listenFlag.current) return;
      e.preventDefault();
      listenFlag.current = false;
      setListening(false);
      stopRec();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <div className="avatar-card-container">
      <div className="avatar-canvas-container">
        <Canvas camera={{ position: [0, 1, 3], fov: 38 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <group position={[0, -1, 0]}>
              <AvatarModel speaking={speaking} mouthRef={mouthRef} />
            </group>
          </Suspense>
        </Canvas>
      </div>

      {showSubtitles && (
        <div className="avatar-subtitles">{subtitle}</div>
      )}
      <div className="avatar-status">
        {listening
          ? "Listening…"
          : thinking
          ? "Thinking…"
          : speaking
          ? "Speaking…"
          : "Hold Space to Talk"}
      </div>
    </div>
  );
}
