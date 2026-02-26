import { supabase } from './supabase';

export const logAction = async (userEmail, action, details) => {
  try {
    await supabase.from('system_logs').insert([{
      user_email: userEmail,
      action: action,
      details: details
    }]);
  } catch (error) {
    console.error("Erro ao gravar log:", error);
  }
};