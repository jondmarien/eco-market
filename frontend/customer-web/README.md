# EcoMarket Customer Web App

A modern, responsive web application for the EcoMarket sustainable e-commerce platform, built with Next.js 15, TypeScript, and Tailwind CSS.

## 🌟 Features

- ✅ **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS
- ✅ **Responsive Design**: Mobile-first design that works on all devices
- ✅ **Eco-Themed UI**: Custom color palette inspired by nature
- ✅ **API Integration**: React Query for efficient data fetching
- ✅ **Authentication Ready**: JWT token management with automatic refresh
- ✅ **Search Functionality**: Product search with filters
- ✅ **Performance Optimized**: Server-side rendering and static generation

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom eco-themed colors
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm, yarn, or pnpm

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API endpoints
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**: Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 API Integration

The app integrates with EcoMarket microservices:

- **User Service** (Port 4000): Authentication and user management
- **Product Service** (Port 5000): Product listing and search
- **Order Service** (Port 6000): Shopping cart and orders

## 🌍 Sustainability Features

- **Carbon Footprint Display**: Show environmental impact
- **Sustainability Badges**: Organic, local, recyclable indicators
- **Eco-Scoring**: Products rated by environmental impact
- **Green Shipping**: Carbon-neutral delivery options

## 📱 Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/               # Utilities and API client
```

## 🎨 Design System

- **Eco Green**: Primary sustainable theme colors
- **Ocean Blue**: Secondary colors for trust
- **Earth Brown**: Accent colors for warmth
- **Responsive**: Mobile-first responsive design

## 📦 Deployment

```bash
npm run build
npm start
```

## 🤝 Contributing

1. Follow TypeScript and ESLint rules
2. Use semantic commit messages
3. Test responsive design
4. Ensure accessibility standards

---

**EcoMarket** - *Making sustainable shopping accessible to everyone* 🌱
