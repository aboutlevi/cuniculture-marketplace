-- ============================================
-- LapinBénin Marketplace - Script SQL Supabase
-- Copiez-collez ce code dans l'éditeur SQL de Supabase
-- ============================================

-- 1. TABLE PROFILES (utilisateurs)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  nom TEXT NOT NULL,
  telephone TEXT,
  type TEXT NOT NULL CHECK (type IN ('eleveur', 'restaurant')),
  ville TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE PRODUITS (catalogue des éleveurs)
CREATE TABLE produits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  eleveur_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  poids_kg DECIMAL(5,2),
  description TEXT,
  disponible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE COMMANDES
CREATE TABLE commandes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES profiles(id) NOT NULL,
  eleveur_id UUID REFERENCES profiles(id) NOT NULL,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'livree', 'annulee')),
  montant_total DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE LIGNES DE COMMANDE
CREATE TABLE commande_lignes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commande_id UUID REFERENCES commandes(id) ON DELETE CASCADE NOT NULL,
  produit_id UUID REFERENCES produits(id) NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(10,2) NOT NULL
);

-- 5. TABLE CONVERSATIONS (messagerie)
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- 6. TABLE MESSAGES
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SÉCURITÉ (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE commande_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- PROFILES: tout le monde peut lire, chacun gère le sien
CREATE POLICY "Profiles visibles par tous" ON profiles FOR SELECT USING (true);
CREATE POLICY "Créer son profil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Modifier son profil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- PRODUITS: visibles par tous, gérés par l'éleveur
CREATE POLICY "Produits visibles par tous" ON produits FOR SELECT USING (true);
CREATE POLICY "Éleveur crée ses produits" ON produits FOR INSERT WITH CHECK (auth.uid() = eleveur_id);
CREATE POLICY "Éleveur modifie ses produits" ON produits FOR UPDATE USING (auth.uid() = eleveur_id);
CREATE POLICY "Éleveur supprime ses produits" ON produits FOR DELETE USING (auth.uid() = eleveur_id);

-- COMMANDES: visibles par les deux parties
CREATE POLICY "Voir ses commandes" ON commandes FOR SELECT USING (auth.uid() = restaurant_id OR auth.uid() = eleveur_id);
CREATE POLICY "Créer une commande" ON commandes FOR INSERT WITH CHECK (auth.uid() = restaurant_id);
CREATE POLICY "Modifier une commande" ON commandes FOR UPDATE USING (auth.uid() = eleveur_id OR auth.uid() = restaurant_id);

-- LIGNES DE COMMANDE
CREATE POLICY "Voir les lignes de ses commandes" ON commande_lignes FOR SELECT
  USING (EXISTS (SELECT 1 FROM commandes c WHERE c.id = commande_id AND (c.restaurant_id = auth.uid() OR c.eleveur_id = auth.uid())));
CREATE POLICY "Créer des lignes" ON commande_lignes FOR INSERT WITH CHECK (true);

-- CONVERSATIONS
CREATE POLICY "Voir ses conversations" ON conversations FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Créer une conversation" ON conversations FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Modifier sa conversation" ON conversations FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- MESSAGES
CREATE POLICY "Voir les messages de sa conversation" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())));
CREATE POLICY "Envoyer un message" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())));

-- ============================================
-- REALTIME (pour les messages en temps réel)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE commandes;
