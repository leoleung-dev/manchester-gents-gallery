export default function setCorsHeaders(res) {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://photos.manchestergents.com',
    'http://localhost:3000'
  ];

  const origin = res.req?.headers?.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
