# Digital-Assistant-TDT4900

## Folio-Assistant Components (extracted)

This repo contains the chat/assistant front-end code from *Folio* – an internal research project that remains private.  
Only the self-contained UI components and their styles are published here so others can reuse or reference them.

| File | Purpose |
|------|---------|
| AvatarAssistant.jsx | Renders the 3D avatar assistant |
| TextAssistant.jsx   | Plain-text assistant chatbot |
| ChatPage.jsx        | Page that holds text/avatar assistant |
| ChatSettings.jsx    | Settings within the side menu |
| SideMenu.jsx        | Side menu for switching modes or changing settings |
| apiController.jsx   | Handles API functionality (`/stt`, `/llm`, `/tts`) |
| *.css               | Component-scoped styling |

## Animations

<table>
  <tr>
    <th>Idle state</th>
    <th>Speaking state</th>
  </tr>
  <tr>
    <td>
      <video src="idle.mp4"  autoplay loop muted playsinline width="250"></video>
    </td>
    <td>
      <video src="talking.mp4" autoplay loop muted playsinline width="250"></video>
    </td>
  </tr>
</table>
