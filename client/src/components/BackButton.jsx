import { useNavigate } from 'react-router-dom';

// Goes to the previous screen. If the page was opened directly (no history), goes to `fallback`.
const BackButton = ({ fallback = '/dashboard' }) => {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
  return (
    <button type="button" className="back-btn" onClick={goBack}>
      <span aria-hidden="true">←</span> Back
    </button>
  );
};

export default BackButton;