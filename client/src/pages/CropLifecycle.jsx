import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import api from '../api/axios';
 
const CropLifecycle = () => {
  const { crop } = useParams();
  const [stages, setStages] = useState([]);

  useEffect(() => {
    api.get(`/pests/lifecycle/${crop}`).then(({ data }) => setStages(data.data)).catch(() => {});
  }, [crop]);

  return (
    <div className="page">
      <BackButton />
      <h2>{crop} — Crop Lifecycle</h2>
      <div className="timeline">
        {stages.map((s, i) => (
          <div key={i} className="timeline-item">
            <strong>Day {s.day} — {s.stage}</strong>
            <p>{s.task}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CropLifecycle;
