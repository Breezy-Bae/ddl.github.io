
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Team, Actress } from '@/types';

export const useTeamData = (teamId: string | null) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Actress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const teamUnsubscribe = onSnapshot(
      doc(db, 'teams', teamId),
      (doc) => {
        if (doc.exists()) {
          setTeam({ id: doc.id, ...doc.data() } as Team);
        }
      }
    );

    const rosterUnsubscribe = onSnapshot(
      query(collection(db, 'actresses'), where('teamId', '==', teamId)),
      (snapshot) => {
        const rosterData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Actress));
        setRoster(rosterData);
        setLoading(false);
      }
    );

    return () => {
      teamUnsubscribe();
      rosterUnsubscribe();
    };
  }, [teamId]);

  return { team, roster, loading };
};
