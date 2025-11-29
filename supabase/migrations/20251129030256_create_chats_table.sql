/*
  # Create chats table for LannZAi chat history

  1. New Tables
    - `chats`
      - `id` (uuid, primary key) - Unique identifier for each chat session
      - `title` (text) - Title of the chat (first message preview)
      - `messages` (jsonb) - Array of message objects with role and content
      - `created_at` (timestamptz) - When the chat was created
      - `updated_at` (timestamptz) - When the chat was last updated
  
  2. Security
    - Enable RLS on `chats` table
    - For now, allow public access for demo purposes
    - In production, add authentication and user-specific policies
*/

CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to chats"
  ON chats
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to chats"
  ON chats
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to chats"
  ON chats
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to chats"
  ON chats
  FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
