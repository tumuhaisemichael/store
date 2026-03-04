# CloudVault ☁️

CloudVault is a premium, secure digital asset management system designed for seamless storage, organization, and access to media and documents. Built with a focus on high-end aesthetics and robust functionality, it provides a centralized "vault" for administrators to manage their digital content with ease.

## ✨ Key Features

-   **Multi-Format Support**: Effortlessly upload and manage **Images** (PNG, JPG, WEBP), **Videos** (MP4, MOV, WebM), and **Documents** (PDF, DOCX, TXT, etc.).
-   **Intelligent Organization**: Create custom folders to categorize your files. Navigate through your hierarchy with an intuitive breadcrumb system.
-   **Premium Glassmorphism UI**: A stunning, modern interface featuring high-end "glass" effects, mesh gradients, and smooth animations powered by the **Outfit** typography.
-   **Fully Responsive**: Access your vault from any device. The adaptive sidebar collapses into a sleek mobile menu for on-the-go management.
-   **Real-time Upload Tracking**: Monitor your uploads with dynamic progress bars and status indicators.
-   **Automated Database Management**: Self-healing database architecture that automatically performs migrations and repairs upon server startup.
-   **Instant Previews**: High-performance video player and image lightbox built-in for immediate content review.

## 🛠 Tech Stack

-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Database**: [MySQL](https://www.mysql.com/) with `mysql2` connection pooling
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Styling**: Vanilla CSS with Advanced Glassmorphism & Mesh Gradients

## 🚀 Getting Started

### 1. Prerequisites
-   Node.js 18+ installed
-   A running MySQL database instance

### 2. Environment Setup
Create a `.env.local` file in the root directory and add your database credentials:
```env
DB_HOST=your_host
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database_name
```

### 3. Installation
```bash
npm install
```

### 4. Run the App
```bash
npm run dev
```

### 5. Initialize Database
Once the app is running, log in with the default administrator credentials (**Admin** / **password**). The system will automatically detect and initialize the required database tables.

---

## 🛡 Security Note
CloudVault stores physical files in a dedicated `uploads_vault` directory outside of the public web root for enhanced security. Access to these files is piped through protected API routes.
