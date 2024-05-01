import React, { useState, useRef, useEffect } from 'react';
import { PatientForm } from '../components/PatientForm';
import ActivityDisplay from '../components/ActivityDisplay';

export default function Home() {
  const [activities, setActivities] = useState<{ activity_1: string; activity_2: string; activity_3: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed to reflect specific action
  const activitiesRef = useRef<HTMLDivElement>(null);

  const handleFormSubmit = async (patientData: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      const activitiesText = result.result.parts[0].text;
      const jsonText = activitiesText.replace(/```json\n|\n```/g, '');
      const activities = JSON.parse(jsonText);
  
      setActivities(activities);
  
      setIsSubmitting(false);
  
      // Scroll to activities after a short delay to ensure the DOM has updated
      setTimeout(() => {
        if (activitiesRef.current) {
          activitiesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
  
    } catch (error) {
      console.error('Error submitting patient data:', error);
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="background-container min-h-screen flex flex-col justify-center items-center px-4 w-full">
      <PatientForm onSubmit={handleFormSubmit} />
      {isSubmitting && <div className="form-submission-progress">Submitting...</div>}
      <div ref={activitiesRef}>
        {activities && <ActivityDisplay activities={activities} />}
      </div>
    </div>
  );
  
  
}
