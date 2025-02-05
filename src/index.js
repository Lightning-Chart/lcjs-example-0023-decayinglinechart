/**
 * LightningChartJS example for Line Chart with refreshing data, where older samples are displayed for a while, slowly decaying out.
 */

const lcjs = require('@lightningchart/lcjs')
const { lightningChart, emptyFill, SolidFill, SolidLine, ColorRGBA, Themes } = lcjs

// Amount of data points in each sample.
const SAMPLE_SIZE = 1280
// Amount of unique samples in application.
const SAMPLE_COUNT = 300
// Max amount of samples displayed at any time.
const DECAY_STEPS_COUNT = 75

const chart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
    .ChartXY({
        theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
    })
    .setTitle('Decaying Line Chart')
    .setCursorMode(undefined)

const theme = chart.getTheme()
const axisX = chart.getDefaultAxisX()
const axisY = chart.getDefaultAxisY().setInterval({ start: -1.05, end: 1.05 })

// Generate series for each sample that can be displayed at a time.
const seriesList = new Array(DECAY_STEPS_COUNT).fill(0).map((_, i) => {
    const series = chart
        .addPointLineAreaSeries({
            dataPattern: 'ProgressiveX',
        })
        .setAreaFillStyle(emptyFill)
        .setPointFillStyle(emptyFill)
    return series
})

const defaultStrokeColor = seriesList[0].getStrokeStyle().getFillStyle().getColor()

// Generate list of stroke styles for each decay step.
const strokeStyles = new Array(DECAY_STEPS_COUNT).fill(0).map((_, i) => {
    const lerpPos = i / DECAY_STEPS_COUNT
    // Linear interpolation convenience function.
    const lerp = (v0, v1, p) => v0 * (1 - p) + v1 * p
    return new SolidLine({
        thickness: 1,
        fillStyle: new SolidFill({
            // Decay step colors shift between default stroke color and fully transparent white.
            color: ColorRGBA(
                lerp(defaultStrokeColor.getR(), theme.isDark ? 0 : 255, lerpPos),
                lerp(defaultStrokeColor.getG(), theme.isDark ? 0 : 255, lerpPos),
                lerp(defaultStrokeColor.getB(), theme.isDark ? 0 : 255, lerpPos),
                lerp(255, 0, lerpPos),
            ),
        }),
    })
})

// Generate example data.
const data = []
for (let i = 0; i < SAMPLE_COUNT; i += 1) {
    const sample = []
    const amplitude = Math.cos((i * 2 * Math.PI) / SAMPLE_COUNT)
    for (let x = 0; x < SAMPLE_SIZE; x += 1) {
        let y = Math.cos(i * 0.01 + (5 * x * Math.PI) / SAMPLE_SIZE) * amplitude
        y += Math.random() * 0.02
        sample.push({ x, y })
    }
    data.push(sample)
}

// Setup data animation.
let iteration = 0
const nextIteration = () => {
    // Update data of 1 series.
    const newSampleData = data[iteration % SAMPLE_COUNT]
    const newSampleSeriesIndex = iteration % seriesList.length
    const newSampleSeries = seriesList[newSampleSeriesIndex]
    newSampleSeries.clear().appendJSON(newSampleData)

    // Update style of every series for decay effect.
    seriesList.forEach((series, i) => {
        let seriesStyleIndex = newSampleSeriesIndex - i
        if (seriesStyleIndex < 0) {
            seriesStyleIndex = strokeStyles.length + seriesStyleIndex
        }
        const seriesStyle = strokeStyles[seriesStyleIndex]
        series.setStrokeStyle(seriesStyle)
    })

    // Schedule next update and update counter.
    iteration += 1
    requestAnimationFrame(nextIteration)
}
nextIteration()
