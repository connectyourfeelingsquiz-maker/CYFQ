'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [questions, setQuestions] = useState([
    {
      id: Date.now().toString(),
      text: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]
    }
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        text: '',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]
      }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) return;
    const newQ = [...questions];
    newQ.splice(index, 1);
    setQuestions(newQ);
  };

  const handleMoveQuestion = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    
    const newQ = [...questions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newQ[index];
    newQ[index] = newQ[swapIndex];
    newQ[swapIndex] = temp;
    
    setQuestions(newQ);
  };

  const handleQuestionTextChange = (index, val) => {
    const newQ = [...questions];
    newQ[index].text = val;
    setQuestions(newQ);
  };

  const handleOptionTextChange = (qIndex, oIndex, val) => {
    const newQ = [...questions];
    newQ[qIndex].options[oIndex].text = val;
    setQuestions(newQ);
  };

  const handleSetCorrectOption = (qIndex, oIndex) => {
    const newQ = [...questions];
    newQ[qIndex].options.forEach((opt, idx) => {
      opt.isCorrect = (idx === oIndex);
    });
    setQuestions(newQ);
  };

  const validateQuiz = () => {
    if (!title.trim()) return 'Quiz Title is required.';
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} text is missing.`;
      
      let hasCorrect = false;
      for (let j = 0; j < q.options.length; j++) {
        const o = q.options[j];
        if (!o.text.trim()) return `Question ${i + 1}, Option ${j + 1} is missing text.`;
        if (o.isCorrect) hasCorrect = true;
      }
      
      if (!hasCorrect) return `Question ${i + 1} needs a correct answer selected.`;
    }
    
    return null;
  };

  const handlePublish = async () => {
    setError('');
    const validationError = validateQuiz();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          questions: questions.map((q, idx) => ({
            text: q.text.trim(),
            order_index: idx,
            options: q.options.map((o, oIdx) => ({
              text: o.text.trim(),
              is_correct: o.isCorrect,
              order_index: oIdx
            }))
          }))
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/quiz/${data.share_token}/share`);
      } else {
        setError(data.error || 'Failed to publish quiz.');
        setSaving(false);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while publishing.');
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div style={{ width: '100%', maxWidth: '800px', padding: '0 1rem' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--accent-primary)' }}>Create Your CYFQ</h1>
          <Link href="/dashboard">
            <button className="btn btn-secondary">Cancel</button>
          </Link>
        </header>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '8px', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        {/* Quiz Metadata */}
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <div className="input-group">
            <label>Quiz Title</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. How Well Do You Know Me?" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Quiz Description (Optional)</label>
            <textarea 
              className="input-field" 
              placeholder="e.g. Let's see how well you actually know me." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, qIndex) => (
          <div key={q.id} className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--glass-border)', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--accent-secondary)' }}>Question {qIndex + 1}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleMoveQuestion(qIndex, 'up')} 
                  disabled={qIndex === 0}
                  className="btn-secondary" 
                  style={{ padding: '0.25rem 0.5rem', opacity: qIndex === 0 ? 0.5 : 1 }}
                >↑</button>
                <button 
                  onClick={() => handleMoveQuestion(qIndex, 'down')} 
                  disabled={qIndex === questions.length - 1}
                  className="btn-secondary" 
                  style={{ padding: '0.25rem 0.5rem', opacity: qIndex === questions.length - 1 ? 0.5 : 1 }}
                >↓</button>
                <button 
                  onClick={() => handleRemoveQuestion(qIndex)} 
                  disabled={questions.length === 1}
                  className="btn-secondary" 
                  style={{ padding: '0.25rem 0.5rem', color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}
                >×</button>
              </div>
            </div>

            <div className="input-group">
              <label>Question Text</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. What's my favorite food?" 
                value={q.text}
                onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
              />
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Answer Options <span style={{ color: 'var(--accent-danger)' }}>(Select ONE correct answer)</span>
              </label>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: opt.isCorrect ? 'rgba(52, 211, 153, 0.1)' : 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px', border: opt.isCorrect ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--glass-border)' }}>
                    
                    <input 
                      type="radio" 
                      name={`correct-${q.id}`} 
                      checked={opt.isCorrect} 
                      onChange={() => handleSetCorrectOption(qIndex, oIndex)}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                    
                    <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      {String.fromCharCode(65 + oIndex)}.
                    </span>
                    
                    <input 
                      type="text" 
                      style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' }}
                      placeholder={`Option ${oIndex + 1}`}
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                    />
                    
                    {opt.isCorrect && (
                      <span style={{ color: 'var(--accent-success)', fontSize: '0.75rem', fontWeight: 'bold' }}>CORRECT</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '3rem' }}>
          <button 
            onClick={handleAddQuestion}
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '1rem', borderStyle: 'dashed' }}
          >
            + Add Question
          </button>

          <button 
            onClick={handlePublish}
            disabled={saving}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
          >
            {saving ? 'Publishing...' : 'Publish Quiz'}
          </button>
        </div>

      </div>
    </div>
  );
}
