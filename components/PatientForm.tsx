import { useState } from 'react';
import TextAreaAutoResize from './TextAreaAutoResize'; // Adjust the import path as necessary

interface PatientFormProps {
  onSubmit: (data: any) => void;
}



export const PatientForm = ({ onSubmit }: PatientFormProps) => {
  const [patientInfo, setPatientInfo] = useState({
    age: '',
    condition: '',
    mobility: '',
    communicationAbility: '',
    additionalNotes: '',
    customCondition: '',
    customMobility: '',


  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number' && (parseInt(value) < 0 || isNaN(parseInt(value)))) return; // Prevent negative or invalid numbers
    setPatientInfo({ ...patientInfo, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(patientInfo);
  };

  return (
    <div className="h-screen flex justify-center items-center ">
      <div className="form-container">
        <h2 className="text-2xl font-semibold mb-4 text-white">Patient Information Form</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Age field */}
          <div className="flex flex-col">
            <label htmlFor="age" className="block text-sm font-medium text-white">Age</label>
            <input
              id="age"
              type="number"
              name="age"
              value={patientInfo.age}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-600 bg-gray-700 text-white rounded-md w-full focus:ring focus:ring-blue-500"
              placeholder="Enter age in years"
              min="0"
              required
            />
          </div>
          {/* Medical Condition dropdown */}
          <div className="flex flex-col">
            <label htmlFor="condition" className="label-style">Medical Condition</label>
            <select
              id="condition"
              name="condition"
              value={patientInfo.condition}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-600 bg-gray-700 text-white rounded-md w-full focus:ring focus:ring-blue-500"
              required
            >
              <option value="" disabled style={{ color: 'gray', opacity: 0.5 }}>Select Condition</option>
              <option value="post-operative recovery">Post-operative Recovery</option>
              <option value="chronic pain">Chronic Pain</option>
              <option value="limited mobility">Limited Mobility</option>
              <option value="other">Other (please specify)</option>
            </select>
            {patientInfo.condition === 'other' && (
              <input
                type="text"
                name="customCondition"
                value={patientInfo.customCondition || ''}
                onChange={handleChange}
                placeholder="Type your condition"
                className="mt-1 p-2 border border-gray-600 bg-gray-700 text-white rounded-md w-full focus:ring focus:ring-blue-500"
                required
              />
            )}
          </div>
          {/* Mobility Level dropdown */}
          <div className="flex flex-col">
            <label htmlFor="mobility" className="label-style">Mobility Level</label>
            <select
              id="mobility"
              name="mobility"
              value={patientInfo.mobility}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-600 bg-gray-700 text-white rounded-md w-full focus:ring focus:ring-blue-500"
              required
            >
              <option value="" disabled style={{ color: 'gray', opacity: 0.5 }}>Select Mobility Level</option>
              <option value="bedridden">Bedridden</option>
              <option value="limited mobility">Limited Mobility</option>
              <option value="fully mobile">Fully Mobile</option>
              <option value="other">Other (please specify)</option>
            </select>
            {patientInfo.mobility === 'other' && (
              <input
                type="text"
                name="customMobility"
                value={patientInfo.customMobility || ''}
                onChange={handleChange}
                placeholder="Type your condition"
                className="mt-1 p-2 border border-gray-600 bg-gray-700 text-white rounded-md w-full focus:ring focus:ring-blue-500"
                required
              />
            )}
          </div>
          {/* Communication Ability dropdown */}
          <div className="flex flex-col">
            <label htmlFor="communicationAbility" className="label-style">Communication Ability</label>
            <select
              id="communicationAbility"
              name="communicationAbility"
              value={patientInfo.communicationAbility}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-600 bg-gray-700 text-white rounded-md w-full focus:ring focus:ring-blue-500"
              required
            >
              <option value="" disabled style={{ color: 'gray', opacity: 0.5 }}>Select Communication Ability</option>
              <option value="can speak clearly">Can Speak Clearly</option>
              <option value="limited verbal ability">Limited Verbal Ability</option>
              <option value="non-verbal">Non-verbal</option>
            </select>

          </div>
          {/* Additional Notes field */}
          <div className="flex flex-col">
            <TextAreaAutoResize
              label="Additional Notes"
              value={patientInfo.additionalNotes}
              onChange={handleChange}
              placeholder="Type any other information here"
            />
          </div>
          {/* Submit button */}
          <div>
            <button type="submit" className="button-style w-full">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
