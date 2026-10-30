import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES, GENRES, SHORT_REVIEW_LIMIT, initialReview, normalizeReview, safePhotoUrl, validateRecord } from './recordModel';
import { preparePhoto } from './photo';
import RecordIcon from './RecordIcon';
import './record.css';

function FieldError({ name, errors }) {
  return errors[name] ? <p id={`b-error-${name}`} className="b-error">{errors[name]}</p> : null;
}

export function RecordNotice({ title, children, loading = false }) {
  return <main className="b-record b-notice" aria-busy={loading}>
    <span className="b-eyebrow">MY ARCHIVE / RECORD</span>
    <h1 className="title-font">{title}</h1><p>{children}</p><Link className="b-button b-primary" to="/">홈으로 돌아가기</Link>
  </main>;
}

export default function RecordPage({ mode, work, review, archive }) {
  const creatingWork = mode === 'work';
  const editing = mode === 'edit';
  const navigate = useNavigate();
  const originalReview = useRef(review).current;
  const [workValues, setWorkValues] = useState({ title: '', category: 'movie', genre: '' });
  const [values, setValues] = useState(() => initialReview(review));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const lock = useRef(false);
  const photoRequest = useRef(0);
  const mounted = useRef(true);
  const fileInput = useRef(null);
  const form = useRef(null);
  const cancelDialog = useRef(null);
  const backTo = creatingWork ? '/' : `/works/${encodeURIComponent(work.id)}`;
  const title = creatingWork ? '어떤 작품과 시간을\n보내셨나요?' : editing ? '그날의 기억을\n다듬어 보세요.' : '같은 작품, 또 다른\n오늘의 기억';
  const workCategory = CATEGORIES.find(item => item.value === work?.category);
  const submitAction = creatingWork ? archive?.createWorkWithReview : editing ? archive?.updateReview : archive?.addReview;
  const connected = typeof submitAction === 'function';
  const preview = safePhotoUrl(values.photoUrl);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; photoRequest.current += 1; };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const preventLoss = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, [dirty]);
  useEffect(() => {
    if (!showCancel) return;
    const previousFocus = document.activeElement;
    cancelDialog.current?.querySelector('button')?.focus();
    return () => previousFocus?.focus();
  }, [showCancel]);

  function change(name, value, isWork = false) {
    (isWork ? setWorkValues : setValues)(previous => ({ ...previous, [name]: value }));
    setDirty(true);
    setErrors(previous => ({ ...previous, [name]: '' }));
    setStatus('');
  }
  function cancel() {
    if (lock.current) return;
    if (!dirty) navigate(backTo);
    else setShowCancel(true);
  }
  async function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const request = ++photoRequest.current;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const photoUrl = await preparePhoto(file);
      if (mounted.current && request === photoRequest.current) change('photoUrl', photoUrl);
    } catch (error) {
      if (mounted.current && request === photoRequest.current) setPhotoError(error.message);
    } finally {
      if (mounted.current && request === photoRequest.current) setPhotoBusy(false);
    }
  }
  async function save(event) {
    event.preventDefault();
    if (lock.current || photoBusy) return;
    const nextErrors = validateRecord(workValues, values, creatingWork, originalReview);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus('필수 항목과 입력 내용을 확인해 주세요.');
      requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    if (!connected) { setStatus('공통 저장 기능 연결 후 저장할 수 있어요. 입력 내용은 유지됩니다.'); return; }
    lock.current = true;
    setBusy(true);
    setStatus('');
    try {
      const draft = normalizeReview(values, editing ? originalReview : undefined);
      let targetId = work?.id;
      if (creatingWork) {
        const result = await archive.createWorkWithReview({ title: workValues.title.trim(), category: workValues.category, genre: workValues.genre.trim() }, draft);
        targetId = result?.workId;
        if (typeof targetId !== 'string' || !targetId) throw new Error('저장 결과의 작품 ID를 확인하지 못했어요. 중복 저장 전에 A 담당 연결을 확인해 주세요.');
      } else if (editing) await archive.updateReview(originalReview.id, draft, originalReview);
      else await archive.addReview(work.id, draft);
      if (!mounted.current) return;
      setDirty(false);
      navigate(`/works/${encodeURIComponent(targetId)}`, { state: { recordSaved: true }, replace: true });
    } catch (error) {
      if (mounted.current) setStatus(error instanceof Error && error.message ? error.message : '저장하지 못했어요. 입력 내용을 유지했으니 다시 시도해 주세요.');
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const invalid = name => ({ 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `b-error-${name}` : undefined });

  return <main className="b-record">
    <header className="b-topbar"><button type="button" onClick={cancel} disabled={busy} aria-label="작성 취소하고 돌아가기"><RecordIcon name="arrow" /></button><span>{editing ? '기록 수정하기' : creatingWork ? '새 작품 기록하기' : '새로운 감상 기록'}</span></header>
    <div className="b-intro"><p className="b-eyebrow">{creatingWork ? 'NEW ARCHIVE' : editing ? 'EDIT MEMORY' : 'ANOTHER MOMENT'}</p><h1 className="title-font">{title}</h1><p>{creatingWork ? '작품보다 그날의 마음을 기록해 보세요.' : '작품과 함께한 순간을 남겨요.'}</p></div>
    {!creatingWork && <section className="b-work-summary" aria-label="기록할 작품"><span className={`b-summary-mark b-tone-${workCategory?.tone || 'forest'}`}>{work.title}</span><div><small>기록할 작품</small><h2>{work.title}</h2><p>{workCategory?.label || '작품'} · {work.genre}</p></div></section>}
    {!connected && <p className="b-connection" role="status">입력 화면은 준비됐어요. 실제 저장은 A의 공통 저장 기능 연결이 필요해요.</p>}
    <form ref={form} onSubmit={save} noValidate>
      <fieldset disabled={busy} className="b-fieldset">
        {creatingWork && <section className="b-section">
          <div className="b-field"><label htmlFor="b-title">작품명 <em>*</em></label><input id="b-title" value={workValues.title} onChange={e => change('title', e.target.value, true)} placeholder="기억하고 싶은 작품명을 입력해 주세요" required {...invalid('title')} /><FieldError name="title" errors={errors} /></div>
          <fieldset className="b-category"><legend>콘텐츠 유형 <em>*</em></legend><div className="b-category-grid">{CATEGORIES.map(item => <label key={item.value} className={workValues.category === item.value ? 'is-selected' : ''}><input type="radio" name="b-category" value={item.value} checked={workValues.category === item.value} onChange={() => { change('category', item.value, true); change('genre', '', true); }} required {...invalid('category')} /><RecordIcon name={item.icon} />{item.label}</label>)}</div><FieldError name="category" errors={errors} /></fieldset>
          <div className="b-field"><label htmlFor="b-genre">장르 <em>*</em></label><select id="b-genre" value={workValues.genre} onChange={e => change('genre', e.target.value, true)} required {...invalid('genre')}><option value="" disabled>{CATEGORIES.find(item => item.value === workValues.category)?.label} 장르를 선택해 주세요</option>{GENRES[workValues.category].map(genre => <option key={genre} value={genre}>{genre}</option>)}</select><small>작품을 대표하는 장르 하나를 선택해 주세요.</small><FieldError name="genre" errors={errors} /></div>
        </section>}
          <div className="b-field"><label htmlFor="b-date">감상 날짜 <em>*</em></label><input id="b-date" type="date" value={values.viewedAt} onInput={e => change('viewedAt', e.currentTarget.value)} onChange={e => change('viewedAt', e.target.value)} required {...invalid('viewedAt')} /><FieldError name="viewedAt" errors={errors} /></div>
          <fieldset className="b-field b-rating-field"><legend id="b-rating-label">별점 <small>선택</small></legend><div className="b-rating-buttons" role="group" aria-labelledby="b-rating-label">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-label={`${n}점`} aria-pressed={values.rating === n} onClick={() => change('rating', n)} className={values.rating !== null && n <= values.rating ? 'is-filled' : ''}><RecordIcon name="star" size={28} /></button>)}<output aria-live="polite">{values.rating === null ? '미선택' : `${values.rating.toFixed(1)}점`}</output></div>{values.rating !== null && <button className="b-rating-clear" type="button" onClick={() => change('rating', null)}>별점 지우기</button>}{values.rating !== null && !Number.isInteger(values.rating) && <small>기존 {values.rating}점은 그대로 유지돼요. 별을 누르면 선택한 정수 점수로 바뀝니다.</small>}<FieldError name="rating" errors={errors} /></fieldset>
          <div className="b-field"><label htmlFor="b-short">한줄평 <small>선택</small></label><input id="b-short" value={values.shortReview} maxLength={Math.max(SHORT_REVIEW_LIMIT, review?.shortReview?.length || 0)} onChange={e => change('shortReview', e.target.value)} placeholder="그날의 감상을 한 문장으로 남겨 보세요" {...invalid('shortReview')} /><small>{values.shortReview.length} / 80자 · 짧은 감상은 한줄평에 남겨요.</small>{values.shortReview.length > SHORT_REVIEW_LIMIT && <small>기존 긴 기록은 자동으로 자르지 않아요. 내용을 수정하면 80자 이내로 정리해 주세요.</small>}<FieldError name="shortReview" errors={errors} /></div>
          <div className="b-field"><label htmlFor="b-photo">그날의 사진 <small>선택 · 1장</small></label><input className="b-file-input" ref={fileInput} id="b-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy || busy} onChange={selectPhoto} aria-describedby="b-photo-help b-photo-error" />
            {preview ? <div className="b-photo-preview"><img src={preview} alt="감상 기록에 첨부할 사진 미리보기" /><div><button type="button" disabled={photoBusy} onClick={() => fileInput.current?.click()}>사진 바꾸기</button><button type="button" disabled={photoBusy} onClick={() => { change('photoUrl', ''); setPhotoError(''); }}>사진 빼기</button></div></div> : <button className="b-photo-pick" type="button" disabled={photoBusy} onClick={() => fileInput.current?.click()}><RecordIcon name="camera" size={26} /><strong>{photoBusy ? '사진을 준비하고 있어요…' : '사진 추가하기'}</strong><small>그날의 장면, 티켓, 장소를 남겨보세요</small></button>}
            <small id="b-photo-help">JPG · PNG · WebP / 최대 5MB. 저장용 사진은 크기를 줄여요.</small><p className="b-error" id="b-photo-error" role="status">{photoError}</p>{photoBusy && <p role="status">사진을 준비하고 있어요. 잠시만 기다려 주세요.</p>}
          </div>
          <div className="b-field"><label htmlFor="b-story">그날의 이야기 <small>선택</small></label><textarea id="b-story" rows={7} value={values.story} onChange={e => change('story', e.target.value)} placeholder={'누구와 함께했나요?\n어떤 마음이 들었나요?\n그날의 기억을 자유롭게 적어보세요.'} /><small>짧은 메모도 좋아요. 나중의 내가 다시 떠올릴 수 있도록.</small></div>
      </fieldset>
      <div className="b-save-status" role="alert" aria-live="polite">{status}</div>
      <footer className="b-form-footer"><p>날짜 하나만 남겨도 소중한 기록이 됩니다.</p><button type="submit" className="b-button b-primary" disabled={busy || photoBusy || !connected}>{busy ? '저장하는 중…' : editing ? '수정한 기록 저장하기' : '나의 Archive에 저장하기'}<span aria-hidden="true">↗</span></button><button type="button" className="b-cancel" disabled={busy} onClick={cancel}>취소하고 돌아가기</button></footer>
    </form>
    {showCancel && <div className="b-dialog-backdrop"><section ref={cancelDialog} role="alertdialog" aria-modal="true" aria-labelledby="b-cancel-title" aria-describedby="b-cancel-description" className="b-cancel-dialog" onKeyDown={event => {
      if (event.key === 'Escape') setShowCancel(false);
      if (event.key === 'Tab') {
        const buttons = cancelDialog.current.querySelectorAll('button');
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[1].focus(); }
        else if (!event.shiftKey && document.activeElement === buttons[1]) { event.preventDefault(); buttons[0].focus(); }
      }
    }}><h2 id="b-cancel-title">작성을 그만둘까요?</h2><p id="b-cancel-description">변경한 내용은 저장되지 않아요.</p><button type="button" className="b-button b-primary" onClick={() => setShowCancel(false)}>계속 작성하기</button><button type="button" className="b-button b-dialog-leave" onClick={() => navigate(backTo)}>저장하지 않고 나가기</button></section></div>}
  </main>;
}
