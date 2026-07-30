import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import userRoutes from './routes/users';
import entryRoutes from './routes/entries';
import wasteRoutes from './routes/waste';
import areaRoutes from './routes/areas';
import reportRoutes from './routes/reports';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/reports', reportRoutes);

// Root test endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Controle de Sobras - API',
    version: '1.7.1',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend build in production if available
const clientBuildPath = path.join(__dirname, '../../dist/client');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint da API não encontrado' });
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('API Controle de Sobras rodando. Frontend ativo na porta 3000 em modo de desenvolvimento.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 [SERVER] API Controle de Sobras iniciada com sucesso na porta ${PORT}`);
  console.log(`🌐 [URL] http://localhost:${PORT}/api/health`);
});
