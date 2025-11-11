# ✨ AI Style Transfer

Transform your images with the power of Google Gemini AI! This web application allows you to apply the artistic style of one image to the content of another using advanced AI technology.

![AI Style Transfer](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## 🎨 Features

- **🖼️ Dual Image Upload**: Upload both style and content images with drag-and-drop support
- **🤖 AI-Powered**: Uses Google Gemini 2.5 Flash Image model for style transfer
- **🔒 Privacy First**: API keys are stored locally in your browser
- **✨ Beautiful UI**: Modern glassmorphism design with smooth animations
- **📱 Responsive**: Works perfectly on desktop and mobile devices
- **⚡ Fast**: Powered by Vite for lightning-fast development

## 🚀 Live Demo

**Deploy your own:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/joyboy123456/https-github.com-joyboy123456-Style-Converter)

## 📖 How to Use

1. **Get Your API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create or copy your Gemini API key

2. **Enter API Key**
   - Paste your API key in the input field
   - Click "Start Creating"
   - Your key is securely stored in your browser

3. **Upload Images**
   - **Style Reference Image**: The image whose artistic style you want to apply
   - **Source Content Image**: The image you want to transform

4. **Transform**
   - Click "Transform Style" button
   - Wait for the AI to create your masterpiece
   - Download or share your result!

## 🛠️ Local Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/joyboy123456/https-github.com-joyboy123456-Style-Converter.git
cd https-github.com-joyboy123456-Style-Converter

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Optional: Environment Variable

You can also configure the API key via environment variable:

1. Create a `.env.local` file in the project root
2. Add your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Restart the development server

## 🌐 Deploy to Vercel

### Quick Deploy

1. **Fork/Clone this repository**

2. **Visit [Vercel](https://vercel.com)**
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your repository

3. **Configure** (Optional)
   - No environment variables needed!
   - Users will input their own API keys

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Share your live URL!

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🎯 Technology Stack

- **Frontend Framework**: React 19.2.0
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.8.2
- **Styling**: Tailwind CSS (via CDN)
- **AI Model**: Google Gemini 2.5 Flash Image
- **Deployment**: Vercel

## 📁 Project Structure

```
.
├── App.tsx              # Main application component
├── index.tsx            # React entry point
├── index.html           # HTML template
├── components/
│   └── icons.tsx        # Icon components
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── vercel.json          # Vercel deployment config
└── README.md            # This file
```

## 🔐 Privacy & Security

- **API keys are stored locally**: Your Gemini API key is only stored in your browser's localStorage
- **No server-side storage**: We don't store or transmit your API key to any server
- **Direct API communication**: Your browser communicates directly with Google's Gemini API
- **No data collection**: We don't collect any user data or images

## 💰 Pricing

This application is **100% free and open source**. However, using the Google Gemini API may incur costs based on your usage:

- Check [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/billing)
- Free tier available with generous limits
- You control your usage and costs

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Powered by [Google Gemini API](https://ai.google.dev/)
- Built with [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Deployed on [Vercel](https://vercel.com/)

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/joyboy123456/https-github.com-joyboy123456-Style-Converter/issues) page
2. Create a new issue if needed
3. Review the [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

---

**Made with ❤️ and ✨ AI Magic**
