import fetch from "node-fetch";

/**
 * Middleware para verificar token de Firebase
 * Agrega `req.user` con las propiedades necesarias: { uid, id, email, displayName, photoURL }
 */
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    console.log("🔹 Verificando token, header recibido:", header);

    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) {
      console.log("❌ No se proporcionó token");
      return res.status(401).json({ error: "No token provided" });
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyBg_MLIEqy8-_yGnX1HtlDH__2KIi-FuLM`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );

    const data = await response.json();
    console.log("📥 Respuesta Firebase:", data);

    if (!data.users || !data.users.length) {
      console.log("❌ Token inválido o expirado");
      return res.status(401).json({ error: "Invalid token" });
    }

    const firebaseUser = data.users[0];

    // ✅ Objeto unificado para ambos casos
    req.user = {
      uid: firebaseUser.localId,           // necesario para UserPhoto
      id: firebaseUser.localId,            // opcional, para endpoints de perfil
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || "",
      photoURL: firebaseUser.photoUrl || "",
    };

    console.log(
      "✅ Token válido para usuario:",
      req.user.email,
      "| UID:",
      req.user.uid
    );
    next();
  } catch (err) {
    console.error("🚫 Token verify error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
