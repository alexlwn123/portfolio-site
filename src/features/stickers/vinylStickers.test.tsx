import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Bumper } from './Bumper'
import foil from './foil.module.css'
import { FoilWin } from './FoilWin'
import { Ghost } from './Ghost'
import { Jukebox } from './Jukebox'
import { ParkingSign } from './ParkingSign'
import { RecordSticker } from './RecordSticker'

describe('FoilWin', () => {
  it('prints the rank, the project and where it won, on foil', () => {
    const { container } = render(
      <FoilWin
        rank="1st"
        title="Stringer Safety"
        lines={['AI Hack for Freedom I', 'Austin, 2026']}
      />,
    )

    expect(container).toHaveTextContent('1st Stringer Safety AI Hack for Freedom I Austin, 2026')
    expect(container.firstElementChild).toHaveClass(foil.foil ?? '')
  })
})

describe('Bumper', () => {
  it('prints the slogan over two lines, then the small print', () => {
    const { container } = render(
      <Bumper lines={['How to Win', 'Every Hackathon']} note="a real workshop I teach" />,
    )

    expect(container).toHaveTextContent('How to Win Every Hackathon a real workshop I teach')
    expect(container.querySelector('br')).toBeNull()
  })
})

describe('ParkingSign', () => {
  it('names the project and hides the sign’s letter and bolt', () => {
    render(<ParkingSign letter="P" name="Arion Parking" />)

    expect(screen.getByText('Arion Parking')).toBeInTheDocument()
    expect(screen.getByText('P').closest('[aria-hidden="true"]')).not.toBeNull()
  })
})

describe('Jukebox', () => {
  it('prints the name and its lines beside a five-bar equaliser', () => {
    const { container } = render(
      <Jukebox name="Pleb FM" lines={['Lightning jukebox', '1st · SatsxSW 2022']} />,
    )
    const equaliser = container.querySelector('[aria-hidden="true"]')

    expect(container).toHaveTextContent('Pleb FM Lightning jukebox 1st · SatsxSW 2022')
    expect(equaliser?.children).toHaveLength(5)
    expect(equaliser).toHaveTextContent('')
  })
})

describe('RecordSticker', () => {
  it('prints the figures and hides the big mark, which the first line already names', () => {
    const { container } = render(
      <RecordSticker mark="++" lines={['bitcoin++', '13 editions', '51 stage sessions']} />,
    )

    expect(screen.getByText('++')).toHaveAttribute('aria-hidden', 'true')
    expect(container).toHaveTextContent('bitcoin++ 13 editions 51 stage sessions')
  })
})

describe('Ghost', () => {
  it('says what the spot is saved for, and for which hackathon', () => {
    render(
      <Ghost note="this spot saved for hackathon #17" detail="AI Hack for Freedom IV, upcoming" />,
    )

    expect(screen.getByText('this spot saved for hackathon #17')).toBeInTheDocument()
    expect(screen.getByText('AI Hack for Freedom IV, upcoming')).toBeInTheDocument()
  })

  it('leaves the small print off when nothing is announced', () => {
    const { container } = render(<Ghost note="this spot saved for hackathon #17" detail={null} />)

    expect(container.querySelectorAll('p')).toHaveLength(1)
  })
})
