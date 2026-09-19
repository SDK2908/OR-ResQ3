import React, { createContext, useContext, useState, useEffect } from 'react';
import { scheduleApi } from '../api/scheduleApi';

const ScheduleContext = createContext(null);

export function ScheduleProvider({ children }) {
  const [schedule, setSchedule] = useState([]);
  const [operatingRooms, setOperatingRooms] = useState([]);
  const [procedureCatalog, setProcedureCatalog] = useState([]);
  const [recoveryPlan, setRecoveryPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentSchedule = async () => {
    try {
      setLoading(true);
      const data = await scheduleApi.getCurrentSchedule();
      setSchedule(data.schedule || []);
      setOperatingRooms(data.operatingRooms || []);
      setProcedureCatalog(data.procedureCatalog || []);
      setError(null);
    } catch (err) {
      console.warn('[ScheduleContext] Backend fetch failed, relying on frontend resilience fallback:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentSchedule();
  }, []);

  const simulateRecovery = async (emergencyData) => {
    try {
      setLoading(true);
      const plan = await scheduleApi.simulateRecovery(emergencyData);
      setRecoveryPlan(plan);
      return plan;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const applyRecovery = async (plan) => {
    try {
      setLoading(true);
      const res = await scheduleApi.applyRecovery(plan || recoveryPlan);
      if (res.schedule) {
        setSchedule(res.schedule);
      }
      setRecoveryPlan(null);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetSchedule = async () => {
    try {
      setLoading(true);
      const res = await scheduleApi.resetSchedule();
      if (res.schedule) {
        setSchedule(res.schedule);
      }
      setRecoveryPlan(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedule,
        operatingRooms,
        procedureCatalog,
        recoveryPlan,
        loading,
        error,
        fetchCurrentSchedule,
        simulateRecovery,
        applyRecovery,
        resetSchedule,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return ctx;
}
