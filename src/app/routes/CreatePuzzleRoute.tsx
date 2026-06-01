import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient.ts";
import { Session } from "@supabase/supabase-js";
import CreatePuzzle from "../components/CreatePuzzle.tsx";

export default function CreatePuzzleRoute() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Just read the existing session — don't create a new listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/', { replace: true });
      } else {
        setSession(session);
      }
      setReady(true);
    });
  }, []); // no subscription, no duplicate client

  if (!ready) return (
    <div className="min-h-screen bg-[#090b12] flex items-center justify-center text-[#d3c5f6]">
      <div className="animate-pulse font-['Outfit'] tracking-widest text-xs font-bold uppercase">
        Loading...
      </div>
    </div>
  );

  if (!session) return null;

  return <CreatePuzzle session={session} />;
}