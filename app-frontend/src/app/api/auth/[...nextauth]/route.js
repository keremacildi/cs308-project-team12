/*
 * This file is a placeholder to handle import references from other components.
 * Authentication is now handled via user ID in request body instead of sessions.
 */

export const authOptions = {
  providers: [],
};

export async function GET() {
  return new Response(
    JSON.stringify({ 
      message: "Authentication now uses user ID in request body instead of sessions" 
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST() {
  return new Response(
    JSON.stringify({ 
      message: "Authentication now uses user ID in request body instead of sessions" 
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
} 