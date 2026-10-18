// Pinterest style: exercises as pins in a two-column masonry, routines as boards.
// Pins vary in height the way a Pinterest feed does; the 180 px demo images sit centred
// (contain) on white so nothing is cropped or blown up past its resolution.
import { imgSrc, EXIDX } from '../lib/exercises.js'
import { exCount } from '../lib/format.js'
import Icon from './Icon.jsx'

const RATIOS = ['1 / 1', '4 / 5', '1 / 1.18', '5 / 4.4', '4 / 5.6', '1 / 1.06']

export function Pin({ ex, title, sub, i = 0, onClick, children }) {
  return (
    <div className="pin" onClick={onClick}>
      <div className="pin-img" style={{ aspectRatio: RATIOS[i % RATIOS.length] }}>
        {ex && ex.img ? <img loading="lazy" decoding="async" src={imgSrc(ex)} alt="" /> : <Icon name={ex ? 'dumbbell' : 'sparkles'} />}
        {children}
      </div>
      <div className="pin-t capitalize">{title}</div>
      {sub && <div className="pin-s">{sub}</div>}
    </div>
  )
}

export function PinGrid({ children }) {
  return <div className="pins">{children}</div>
}

// A board: one big cover and two smaller images, like a Pinterest board preview.
export function Board({ routine, onClick }) {
  const imgs = routine.ex.map(e => EXIDX[e.id]).filter(e => e && e.img).slice(0, 3)
  const cell = k => imgs[k] ? <img loading="lazy" src={imgSrc(imgs[k])} alt="" /> : null
  return (
    <div className="board" onClick={onClick}>
      <div className="board-c">
        <div className="b0">{cell(0)}</div>
        <div className="b1">{cell(1)}</div>
        <div className="b2">{cell(2)}</div>
      </div>
      <div className="pin-t">{routine.name}</div>
      <div className="pin-s">{exCount(routine.ex.length)}</div>
    </div>
  )
}
