# F-Service Deployment Guide

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account
- Hosting platform (Render, Vercel, Netlify, etc.)
- Domain name (optional)

## 🚀 Deployment Options

### Option 1: Render (Recommended)
Render provides both frontend and backend hosting with easy deployment.

#### Backend Deployment (Render)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up and verify email

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure build settings:

```yaml
# render.yaml (create this file in root)
services:
  - type: web
    name: f-service-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false # Set in Render dashboard
      - key: JWT_SECRET
        sync: false # Set in Render dashboard
      - key: SESSION_SECRET
        sync: false # Set in Render dashboard
      - key: API_SECRET
        sync: false # Set in Render dashboard
      - key: FRONTEND_URL
        value: https://your-frontend.onrender.com
```

3. **Set Environment Variables**
   In Render dashboard → Service → Environment:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-jwt-secret
   SESSION_SECRET=your-session-secret
   API_SECRET=your-api-secret
   FRONTEND_URL=https://your-frontend.onrender.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

#### Frontend Deployment (Render)

1. **Create Static Site**
   - Click "New +" → "Static Site"
   - Connect same repository
   - Configure:

```yaml
# Add to render.yaml
  - type: web
    name: f-service-frontend
    runtime: static
    buildCommand: cd frontend && npm install && npm run build
    publishPath: frontend/dist
    envVars:
      - key: VITE_API_URL
        value: https://your-backend.onrender.com
```

2. **Update Frontend Environment**
   Create `frontend/.env.production`:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

### Option 2: Vercel (Frontend) + Render (Backend)

#### Frontend on Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Frontend**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ]
   }
   ```

### Option 3: Self-Hosted (VPS)

#### Server Setup

1. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx nodejs npm
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/F-Service.git
   cd F-Service
   ```

3. **Build Frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

4. **Setup Backend**
   ```bash
   cd ../backend
   npm install
   cp .env.example .env
   # Edit .env with production values
   ```

5. **Install PM2**
   ```bash
   npm install -g pm2
   pm2 start server.js --name f-service-backend
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           root /path/to/F-Service/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Setup SSL**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## 🔧 Production Configuration

### Backend Production Settings

Update `backend/server.js` for production:

```javascript
// Add production-specific middleware
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Enhanced error handling for production
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
    
  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});
```

### Frontend Production Settings

Update `frontend/vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['axios', 'crypto-js']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
});
```

## 📊 Monitoring & Logging

### Set up Monitoring

1. **Application Monitoring**
   ```bash
   npm install -g pm2
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 30
   ```

2. **Health Check Endpoint**
   Already exists: `/api/health`

3. **Error Tracking**
   Consider services like:
   - Sentry (error tracking)
   - LogRocket (session replay)
   - Uptime monitoring (UptimeRobot, Pingdom)

## 🔒 Security for Production

### Essential Security Steps

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique secrets
   - Rotate secrets regularly

2. **Database Security**
   - Use MongoDB Atlas (already configured)
   - Enable IP whitelisting
   - Use strong authentication

3. **SSL/TLS**
   - Force HTTPS redirects
   - Use valid SSL certificates
   - Enable HSTS headers

4. **Firewall Rules**
   ```bash
   # Only allow necessary ports
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Build process successful

### Post-deployment
- [ ] Health check passing
- [ ] SSL certificate valid
- [ ] Error monitoring active
- [ ] Performance monitoring setup
- [ ] Backup strategy implemented

### Testing
- [ ] User registration/login
- [ ] Service creation/management
- [ ] Payment processing
- [ ] Admin functions
- [ ] Mobile responsiveness

## 📈 Performance Optimization

### Backend Optimization
- Enable gzip compression
- Implement caching strategies
- Use CDN for static assets
- Optimize database queries

### Frontend Optimization
- Code splitting implemented
- Images optimized
- Lazy loading enabled
- Bundle size minimized

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: |
          cd frontend && npm install && npm test
          cd ../backend && npm install && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check FRONTEND_URL in backend env
   - Verify API URL in frontend env

2. **Database Connection**
   - Check MongoDB URI format
   - Verify IP whitelist in Atlas
   - Check network access

3. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies installed

4. **Memory Issues**
   - Increase server memory
   - Optimize database queries
   - Implement caching

### Monitoring Commands

```bash
# Check PM2 status
pm2 status
pm2 logs f-service-backend

# Check system resources
htop
df -h
free -h

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs` or `journalctl -u nginx`
2. Verify environment variables
3. Test database connection
4. Check network connectivity

---

**Happy Deploying! 🚀**
