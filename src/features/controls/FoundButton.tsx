type Props = {
  // hidden: no hay rostro · available: se puede registrar · logged: ya registrado
  state: "hidden" | "available" | "logged";
  onFound: () => void;
};

// Aparece solo mientras el rostro es visible y permite registrar un hallazgo por aparición.
export function FoundButton({ state, onFound }: Props) {
  return (
    <div className="found" role="status">
      {state === "available" && (
        <button type="button" className="found__button" onClick={onFound}>
          I see a face
        </button>
      )}
      {state === "logged" && <span className="found__logged">Face logged</span>}
    </div>
  );
}
