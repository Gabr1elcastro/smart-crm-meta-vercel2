
import * as React from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect to dashboard page
    navigate("/");
  }, [navigate]);

  return null;
};

export default Index;
