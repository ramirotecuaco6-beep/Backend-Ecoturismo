// services/mongoService.js
const API_BASE_URL = 'http://localhost:3001/api'; // Ajusta según tu backend

export const mongoService = {
  // Crear usuario en MongoDB
  async createUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) throw new Error('Error creando usuario en MongoDB');
      return await response.json();
    } catch (error) {
      console.error('Error en createUser:', error);
      throw error;
    }
  },

  // Obtener usuario desde MongoDB
  async getUser(uid) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${uid}`);
      if (!response.ok) throw new Error('Usuario no encontrado en MongoDB');
      return await response.json();
    } catch (error) {
      console.error('Error en getUser:', error);
      throw error;
    }
  },

  // Actualizar logros del usuario
  async updateUserAchievements(uid, achievements) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${uid}/achievements`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logros: achievements })
      });
      
      if (!response.ok) throw new Error('Error actualizando logros');
      return await response.json();
    } catch (error) {
      console.error('Error en updateUserAchievements:', error);
      throw error;
    }
  },

  // Agregar un logro específico
  async addAchievement(uid, achievement) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${uid}/achievements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(achievement)
      });
      
      if (!response.ok) throw new Error('Error agregando logro');
      return await response.json();
    } catch (error) {
      console.error('Error en addAchievement:', error);
      throw error;
    }
  }
};