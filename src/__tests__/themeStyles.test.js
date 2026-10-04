import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cwd } from 'node:process'

const css = readFileSync(resolve(cwd(), 'src/index.css'), 'utf8')

function palette(theme) {
  const block = css.split(`[data-theme='${theme}'] {`)[1].split('}')[0]
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)]
    .map(([, name, value]) => [name, value.trim()]))
}

function luminance(rgb) {
  return rgb.map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

describe('theme palettes', () => {
  const light = palette('light')
  const dark = palette('dark')
  const color = (name) => dark[`--color-${name}`].split(' ').map(Number)

  it('fully resets every dark token inside a light export scope', () => {
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort())
    expect(light['--color-background']).toBe('255 255 255')
    expect(light['--color-base-content']).toBe('31 41 55')
  })

  it.each([
    ['base-content', 'base-100'],
    ['base-content', 'background'],
    ['muted-foreground', 'base-100'],
    ['primary-content', 'primary'],
    ['primary-label', 'base-300'],
    ['danger', 'base-100'],
    ['note-content', 'note'],
  ])('keeps dark %s text readable against %s', (foreground, background) => {
    expect(contrast(color(foreground), color(background))).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps subtle labels, control borders, and focus rings visible', () => {
    const background = color('base-100')
    const opacity = Number(dark['--opacity-subtle'])
    const subtle = color('base-content').map((value, index) =>
      value * opacity + background[index] * (1 - opacity))
    expect(contrast(subtle, background)).toBeGreaterThanOrEqual(4.5)
    for (const foreground of ['control-border', 'ring']) {
      for (const surface of ['base-100', 'base-200', 'base-300']) {
        expect(contrast(color(foreground), color(surface))).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
