'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface Student {
  profile: {
    name: string;
    age: number;
    dob: string;
    school: string;
    class: string;
    unique_id: string;
    level_category?: string;
    gender?: string;
    phone?: string;
    parent_name?: string;
    emergency_contact?: string;
    blood_group?: string;
  };
  background_questionnaire: {
    events_attended: boolean;
    medals_won: boolean;
    objective: 'Just Fun' | 'Lifestyle Sport' | 'Passion' | 'Nationals' | 'International';
    coach_rating: number;
  };
  progression: {
    levels: number[];
    timeline_lock_status: boolean;
    last_exam_date: string;
  };
}

export interface Exam {
  id: string;
  studentId: string;
  juryId: string;
  juryName: string;
  level: number;
  date: string;
  time: string;
  status: 'Scheduled' | 'In-Progress' | 'Completed';
  totalScore?: number | null;
  scores?: Record<string, any> | null;
  createdAt?: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  username: string;
  role: string;
  permissions?: string[];
  createdAt?: string;
  status?: string;
}

export interface ScoringItem {
  name: string;
  max_score: number;
  type?: 'numeric' | 'text' | 'select' | 'number';
  options?: string[];
}

export interface ScoringCategory {
  name: string;
  /** Each item carries its own max_score — values differ within a category. */
  items: ScoringItem[];
  /** Default max_score used by the template editor when adding new items. */
  max_score: number;
  /** Category type: 'numeric' (default), 'text' (free-text remarks), 'select' (single-choice). */
  type?: 'numeric' | 'text' | 'select';
  /** For 'select' type: available options to choose from. */
  options?: string[];
}

export interface ScoringTemplate {
  levelName: string;
  passThreshold: number;
  categories: ScoringCategory[];
}

interface DataContextType {
  students: Student[];
  exams: Exam[];
  users: ManagedUser[];
  scoringTemplates: Record<string, ScoringTemplate>;
  loading: boolean;
  refreshStudents: () => Promise<void>;
  refreshExams: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshScoringTemplates: () => Promise<void>;
  addStudent: (student: Student) => Promise<boolean>;
  addStudentsBulk: (students: Student[]) => Promise<boolean>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
  addExam: (exam: { studentId: string; juryId: string; level: number; date: string; time: string }) => Promise<boolean>;
  updateExam: (examId: string, updates: Partial<Exam>) => Promise<boolean>;
  deleteExam: (examId: string) => Promise<boolean>;
  submitScore: (examId: string, scores: Record<string, any>) => Promise<{ success: boolean; totalScore?: number }>;
  saveDraftScore: (examId: string, scores: Record<string, any>) => Promise<{ success: boolean; totalScore?: number; error?: string }>;
  resetDraftScore: (examId: string) => Promise<{ success: boolean; error?: string }>;
  updateExamScores: (examId: string, scores: Record<string, any>) => Promise<{ success: boolean; totalScore?: number }>;
  addUser: (user: { name: string; username: string; role: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, updates: { name?: string; username?: string; role?: string; password?: string; status?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateScoringTemplates: (templates: Record<string, ScoringTemplate>) => Promise<boolean>;
  exportStudentsCSV: () => Promise<void>;
  exportScoresCSV: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [scoringTemplates, setScoringTemplates] = useState<Record<string, ScoringTemplate>>({});
  const [loading, setLoading] = useState(true);

  const refreshStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch { /* ignore */ }
  }, []);

  const refreshExams = useCallback(async () => {
    try {
      const res = await fetch('/api/exams', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams || []);
      }
    } catch { /* ignore */ }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch { /* ignore */ }
  }, []);

  const refreshScoringTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/scoring-templates', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setScoringTemplates(data.templates || {});
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setStudents([]);
      setExams([]);
      setUsers([]);
      setScoringTemplates({});
      setLoading(false);
      return;
    }
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([refreshStudents(), refreshExams(), refreshUsers(), refreshScoringTemplates()]);
      setLoading(false);
    };
    loadAll();

    // Background sync: users + exams change frequently (jury added, exam
    // scheduled/completed in another tab). Poll every 20s so the jury list
    // and exam cards reflect reality without requiring a manual refresh.
    const interval = setInterval(() => {
      refreshUsers();
      refreshExams();
    }, 20000);

    // Also resync immediately when the tab becomes visible again — covers
    // the "left tab open for an hour" case without waiting for the next tick.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshUsers();
        refreshExams();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated, authLoading, refreshStudents, refreshExams, refreshUsers, refreshScoringTemplates]);

  const addStudent = async (student: Student): Promise<boolean> => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
      if (res.ok) {
        await refreshStudents();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const addStudentsBulk = async (studentsList: Student[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: studentsList }),
      });
      if (res.ok) {
        await refreshStudents();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const updateStudent = async (id: string, updates: Partial<Student>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await refreshStudents();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const deleteStudent = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshStudents();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const addExam = async (exam: { studentId: string; juryId: string; level: number; date: string; time: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam),
      });
      if (res.ok) {
        await refreshExams();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const updateExam = async (examId: string, updates: Partial<Exam>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await refreshExams();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const deleteExam = async (examId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/exams/${examId}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshExams();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const submitScore = async (examId: string, scores: Record<string, any>): Promise<{ success: boolean; totalScore?: number }> => {
    try {
      const res = await fetch(`/api/exams/${examId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshExams();
        return { success: true, totalScore: data.totalScore };
      }
      return { success: false, totalScore: undefined };
    } catch { /* ignore */ }
    return { success: false };
  };

  // Save partial scores without finalizing the exam. Status moves to
  // In-Progress so the jury can return and edit later; last_exam_date is
  // NOT stamped on the student until the final submission.
  const saveDraftScore = async (examId: string, scores: Record<string, any>): Promise<{ success: boolean; totalScore?: number; error?: string }> => {
    try {
      const res = await fetch(`/api/exams/${examId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores, draft: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await refreshExams();
        return { success: true, totalScore: data.totalScore };
      }
      return { success: false, error: data.error || `Draft save failed (HTTP ${res.status})` };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  // Clear a draft: resets scores + totalScore and flips status back to
  // Scheduled so the exam reappears on the schedule.
  const resetDraftScore = async (examId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/exams/${examId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await refreshExams();
        return { success: true };
      }
      return { success: false, error: data.error || `Reset failed (HTTP ${res.status})` };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  // Superadmin-only: edit scores on a completed exam
  const updateExamScores = async (examId: string, scores: Record<string, any>): Promise<{ success: boolean; totalScore?: number }> => {
    try {
      const res = await fetch(`/api/exams/${examId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshExams();
        return { success: true, totalScore: data.totalScore };
      }
    } catch { /* ignore */ }
    return { success: false };
  };

  const addUser = async (user: { name: string; username: string; role: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUsers();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const updateUser = async (id: string, updates: { name?: string; username?: string; role?: string; password?: string; status?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        // Name changes propagate into exams.jury_name server-side; refetch both.
        await Promise.all([refreshUsers(), refreshExams()]);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshUsers();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Delete failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const updateScoringTemplates = async (templates: Record<string, ScoringTemplate>): Promise<boolean> => {
    try {
      const res = await fetch('/api/scoring-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates }),
      });
      if (res.ok) {
        await refreshScoringTemplates();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const exportStudentsCSV = async (): Promise<void> => {
    try {
      const res = await fetch('/api/export/students', { cache: 'no-store' });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'students_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
  };

  const exportScoresCSV = async (): Promise<void> => {
    try {
      const res = await fetch('/api/export/scores', { cache: 'no-store' });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scores_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
  };

  return (
    <DataContext.Provider value={{
      students, exams, users, scoringTemplates, loading,
      refreshStudents, refreshExams, refreshUsers, refreshScoringTemplates,
      addStudent, addStudentsBulk, updateStudent, deleteStudent,
      addExam, updateExam, deleteExam, submitScore, saveDraftScore, resetDraftScore, updateExamScores,
      addUser, updateUser, deleteUser,
      updateScoringTemplates,
      exportStudentsCSV,
      exportScoresCSV,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
