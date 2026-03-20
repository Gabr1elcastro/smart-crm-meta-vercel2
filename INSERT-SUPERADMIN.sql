-- Inserir o usuário super admin
INSERT INTO public.superadmins (nome, email) 
VALUES ('Bruno Cunha', 'contatobrunohcunha@gmail.com')
ON CONFLICT (email) DO NOTHING; 