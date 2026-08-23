import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(_req: any, res: any) {
  try {
    const filePath = join(process.cwd(), 'data', 'pqrs.json');
    const fileData = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileData);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al leer el archivo de PQRS:", error);
    res.status(500).json({ error: "Error interno del servidor al cargar los datos." });
  }
}
