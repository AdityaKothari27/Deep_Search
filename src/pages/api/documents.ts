import type { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../utils/database';

const db = new Database();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - fetch all documents
  if (req.method === 'GET') {
    try {
      const documents = await db.get_documents();
      res.status(200).json(documents);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get documents' });
    }
  } 
  // POST - create new document
  else if (req.method === 'POST') {
    try {
      const { name, content } = req.body;
      
      if (!name || !content) {
        return res.status(400).json({ message: 'Name and content are required' });
      }
      
      // Save document with content directly (no file path needed)
      const id = await db.save_document(name, name, content);
      
      res.status(201).json({ 
        id,
        name,
        message: 'Document saved successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to save document' });
    }
  } 
  // DELETE - delete a document
  else if (req.method === 'DELETE') {
    try {
      const id = Number(req.query.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      // Delete from database (no need to delete from filesystem in serverless)
      await db.delete_document(id);
      res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to delete document' });
    }
  } 
  // Other methods not allowed
  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 