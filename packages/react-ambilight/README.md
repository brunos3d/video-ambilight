# 🌈 Video Ambilight

A lightweight React component to create a stunning **Ambilight effect** for YouTube videos. This package is inspired by the visual effects seen in modern video presentations, adding an immersive ambient glow that synchronizes with your content.

## ✨ Features

- Works seamlessly with YouTube videos using the [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference).
- Supports synchronized playback between the video and the Ambilight effect.
- Customizable and easy to integrate into any React project.

## 📦 Installation

Install the package via npm:

```bash
npm install react-ambilight
```

or using Yarn:

```bash
yarn add react-ambilight
```

## 🔧 Usage

Here's a quick example of how to use the component:

```tsx
import React from 'react'
import { VideoAmbilight } from 'react-ambilight'
import 'react-ambilight/dist/index.css'

export default function App() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <VideoAmbilight videoId='dQw4w9WgXcQ' />
    </div>
  )
}
```

Customize the component by passing a `className` or `classNames` object with custom class names:

```tsx
// tailwind example
import React from 'react'
import { VideoAmbilight } from 'react-ambilight'
import 'react-ambilight/dist/index.css'

export default function App() {
  return (
    <div className='max-w-4xl mx-auto'>
      <VideoAmbilight
        videoId='dQw4w9WgXcQ'
        classNames={{
          videoWrapper: 'relative',
          ambilightWrapper: 'absolute inset-0',
          aspectRatio: 'aspect-w-16 aspect-h-9',
          ambilight: 'bg-black opacity-50',
          ambilightVideo: 'hidden',
        }}
      />
    </div>
  )
}
```

### Props

| Prop         | Type     | Description                             | Required |
| ------------ | -------- | --------------------------------------- | -------- |
| `videoId`    | `string` | The YouTube video ID to display.        | Yes      |
| `className`  | `string` | Optional class name for styling.        | No       |
| `classNames` | `object` | Optional object for custom class names. | No       |

#### classNames Object

The `classNames` object can have the following properties:

| Property           | Type     | Description                                    |
| ------------------ | -------- | ---------------------------------------------- |
| `videoWrapper`     | `string` | Class name for the video wrapper.              |
| `ambilightWrapper` | `string` | Class name for the ambilight wrapper.          |
| `aspectRatio`      | `string` | Class name for the aspect ratio container.     |
| `ambilight`        | `string` | Class name for the ambilight effect container. |
| `ambilightVideo`   | `string` | Class name for the ambilight video container.  |

## 🚀 Demo

Check out a live demo of the Ambilight effect: [Live Demo](https://brunos3d.github.io/video-ambilight/)

## 🛠 How It Works

The component leverages the YouTube IFrame API to create two synchronized players:

1. **Primary Player:** Displays the video.
2. **Ambilight Player:** Runs a low-quality version of the same video in the background to generate the glowing effect.

## 🧩 Contributing

Contributions are welcome! If you encounter any issues or have suggestions, feel free to open an issue or submit a pull request.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add feature-name'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙌 Acknowledgements

Inspired by the Ambilight effect seen during the Next.js Conf presentations.

---

💻 **Made with ❤️ by [Bruno Silva](https://github.com/brunos3d)**
