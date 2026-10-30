import { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';

export default function Field({ label, error, ok, type = 'text', textarea, id, ...p }) {
  const [show, setShow] = useState(false);
  const fid = id || label.replace(/\W/g, '-').toLowerCase();
  const isPw = type === 'password';
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className={`field ${error ? 'err shake' : ''}`} key={error || 'ok'}>
      <Tag id={fid} type={isPw && show ? 'text' : type} placeholder=" " aria-invalid={!!error} aria-describedby={error ? `${fid}-e` : undefined} {...p} />
      <label htmlFor={fid}>{label}</label>
      {isPw && <button type="button" className="icon-btn eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
      {ok && !error && !isPw && <Check size={18} className="eye green" aria-hidden style={{ position: 'absolute', right: 10, top: 16 }} />}
      {error && <div className="msg" id={`${fid}-e`} role="alert">{error}</div>}
    </div>
  );
}
