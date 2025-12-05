import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    version: "1.0.0",
    derniere_mise_a_jour: "2025-12-05",
    nombre_matchs_historique: 200,
    nombre_matchs_futurs: 50,
    nombre_equipes: 14
  });
}
