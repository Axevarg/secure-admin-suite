import { createContext, useContext, useState } from "react";

const ObraContext = createContext<any>(null);

export const ObraProvider = ({ children }: any) => {
  const [obraActiva, setObraActiva] = useState(null);

  return (
    <ObraContext.Provider value={{ obraActiva, setObraActiva }}>
      {children}
    </ObraContext.Provider>
  );
};

export const useObra = () => useContext(ObraContext);