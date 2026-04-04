import { supabaseAuth } from "../config/supabaseClient.js";

export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Missing bearer token."
    });
  }

  if (!supabaseAuth) {
    return res.status(503).json({
      success: false,
      message: "Supabase Auth is not configured on the backend."
    });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }

  req.user = data.user;
  req.token = token;
  next();
}
