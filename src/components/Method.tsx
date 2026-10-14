import { PrivacyPanel } from './shared/PrivacyPanel';
import { APP_VERSION } from '../lib/site';
export function Method() {
    return (<section className="panel method-panel">
      <div className="panel-head">
        <div className="titles"><h2>About this calculator</h2></div>
      </div>
      <div className="panel-body prose">
        <h3>What it does</h3>
        <p>
          This tool turns the median fluorescence intensity (MFI) of your stained cells into antibody
          binding capacity (ABC), the number of antibody molecules bound per cell, by reading it
          off a standard curve built from beads of known, certified capacity. It also gives a
          confidence interval, subtracts your control, and says in words when a result should not
          be reported.
        </p>

        <h3>How to use it</h3>
        <ol>
          <li>
            <strong>Pick the bead kit and, if you can, record the bead lot.</strong> The kit tells
            the tool whether the beads certify antibody binding capacity or PE molecules per bead.
            The lot is a label from the vial; it is not used in the arithmetic, but it is written
            into the export so the result can be traced.
          </li>
          <li>
            <strong>Enter the bead populations.</strong> For each, type the MFI you measured and
            the certified value from the certificate of analysis for your lot. Assigned values
            differ between lots, so copy them from the vial or certificate and never from memory or
            a paper. Leave out a blank population by clearing its certified value or unticking it.
            You need at least three populations.
          </li>
          <li>
            <strong>Enter your samples.</strong> Give each sample its stained MFI and, if you have
            one, its control MFI (isotype or FMO). Take every MFI from a live, singlet-gated
            population, acquired in the same session and at the same settings as the beads.
          </li>
          <li>
            <strong>Make the declarations in Analysis settings.</strong> Background subtraction: density space reads stained and control off the curve
            separately and subtracts the two densities, which treats the background as extra bound
            molecules; MFI space subtracts the control MFI first and converts the difference,
            which treats the background as extra fluorescence. The two agree when the curve slope
            is close to 1 and the background is small, and the tool tells you when they differ by
            more than 10%. In density space the control is often below the lowest bead, and the
            tool flags that when it matters. None reports the stained reading with no correction. Detection antibody: choose whole IgG
            (bivalent) or Fab / scFv (1:1), which sets how many antigen sites each bound antibody
            represents. Antibody host species: the species the detection antibody was raised in,
            so the tool can check it against what the capture beads bind. Stain titration: say yes
            only if the antibody was titrated to saturation on both beads and cells. Fluorophore:
            protein ratio (PE beads only): the number of PE molecules per antibody on your
            conjugate, used to convert PE molecules to antibodies. Confidence level: 90%, 95% or
            99%.
          </li>
          <li>
            <strong>Read the result.</strong> Check the standard curve and any flags first, then
            read each sample&apos;s density and interval. Use Export CSV to copy out the settings,
            raw inputs, fit parameters and results together, and Export SVG for the curve. Load
            worked example shows a complete run, including a sample that is deliberately not
            reportable.
          </li>
        </ol>

        <h3>How it works</h3>
        <p>
          The bead populations are fitted by ordinary least squares in log<sub>10</sub>–log
          <sub>10</sub> space, and the sample MFI is mapped through the resulting line:
        </p>
        <pre>log₁₀(assigned value) = slope · log₁₀(MFI) + intercept</pre>
        <p>
          The control is subtracted according to the background mode you chose, and the sample
          is reported as ABC with a confidence interval. For PE beads the certified value is
          divided by the fluorophore:protein ratio first. With a Fab or scFv detection reagent, each bound antibody marks one site, so sites
          equal the ABC. With whole IgG each bound antibody may hold one site or two, so sites are
          shown as a range from the ABC to twice the ABC. There
          is no model fitting beyond the line, no imputation and no language model, and identical
          inputs always give identical outputs.
        </p>
        <p>
          The reported interval is the confidence interval on the fitted mean response of the
          calibration line, evaluated at the stained reading and carried through to the reported
          density. It excludes measurement variability in the sample itself, which needs replicate
          acquisition to estimate. It also excludes uncertainty in the control reading: the
          background is subtracted as a point value, so the interval describes the position of the
          calibration curve rather than the full uncertainty of the difference. Where background is
          a small fraction of gross density the two are close. As the background fraction rises the
          interval becomes an approximation, and may be narrower or wider than a fully propagated
          interval.
        </p>
        <h4>Constants and assumptions</h4>
        <div className="table-scroll">
        <table>
          <caption className="visually-hidden">Constants and assumptions the calculation uses</caption>
          <thead>
            <tr><th>Name</th><th>Value</th><th>Why</th></tr>
          </thead>
          <tbody>
            <tr><td>Minimum bead populations</td><td>3 (curvature test: 6)</td><td>A line needs three points to have any residual; a quadratic term needs six to be testable with any power.</td></tr>
            <tr><td>Slope warning</td><td>outside 0.85 to 1.15</td><td>A well-behaved standard has a log-log slope near 1; departures point to detector non-linearity or compensation error.</td></tr>
            <tr><td>R² minimum</td><td>0.98; below it no figure from the curve is reported</td><td>A minimum chosen for this tool, not a vendor requirement. Bangs Laboratories states a much stricter figure for its Quantum MESF and Quantum Simply Cellular beads: a regression coefficient of at least 0.9995 is &quot;generally desired&quot; for instrument linearity. A curve that passes 0.98 can fall well short of that. R² is a necessary check, not a sufficient one: a curved standard can pass it.</td></tr>
            <tr><td>Curvature test</td><td>quadratic term, two-sided 5%</td><td>A bend in the standard biases every value read through it, and can leave R² and the slope looking healthy.</td></tr>
            <tr><td>Certified-value agreement</td><td>within 2.5-fold of the median ratio</td><td>On a standard whose log-log slope is near 1, certified value divided by MFI is nearly the same for every population. Within the accepted slope range over a three-decade bead set it stays within about 1.7-fold of the median, while two transposed rows depart by about 3.3-fold and a tenfold typing slip by about 10-fold. 2.5 sits between them.</td></tr>
            <tr><td>Standard span</td><td>at most 6 decades of MFI</td><td>Commercial bead sets span about three decades, so a span beyond six is almost always a misplaced decimal point or two standards pasted together, not a real standard.</td></tr>
            <tr><td>Background share of gross density</td><td>25% material, 50% dominant, 90% below detection</td><td>25% is a chosen point at which the control is doing enough of the work to be worth stating (net three times background); the figure is still reported. At 50% the net equals the background, so no figure or band is reported. At 90% the result is the small difference of two large numbers and is reported as below detection. If the control lies below the lowest bead, any background of 25% or more stops the figure.</td></tr>
            <tr><td>Subtraction-mode divergence</td><td>10%</td><td>Above this the choice between density space and MFI space changes the answer enough to be worth stating.</td></tr>
            <tr><td>Highest plausible density</td><td>2 × 10<sup>7</sup> ABC</td><td>Well above typical antigen densities, and of the order of the number of antibodies that could pack onto the surface of a large cell (a 15 µm cell has about 700 µm² of surface, room for roughly 5 to 14 million antibody footprints of 100 to 150 nm² depending on membrane folding). Above it a figure is arithmetic, not measurement, usually a mistyped MFI, and is not reported.</td></tr>
            <tr><td>Density bands</td><td>100, 1,000 and 10,000 ABC</td><td>Order-of-magnitude reading aids drawn from the CAR literature below, not cutoffs.</td></tr>
            <tr><td>Confidence level</td><td>95% by default</td><td>Your choice of 90%, 95% or 99%.</td></tr>
          </tbody>
        </table>
        </div>
        <p>
          The band boundaries and their notes are order-of-magnitude summaries of published work on
          antigen density thresholds for CAR activation, not values reported by any single study:
        </p>
        <ul>
          <li>
            Majzner RG, et al. Tuning the antigen density requirement for CAR T-cell activity.{' '}
            <em>Cancer Discovery</em>, 2020.
          </li>
          <li>
            Walker AJ, et al. Tumor antigen and receptor densities regulate efficacy of a chimeric
            antigen receptor targeting anaplastic lymphoma kinase. <em>Molecular Therapy</em>, 2017.
          </li>
          <li>
            Watanabe K, et al. Target antigen density governs the efficacy of anti-CD20 CAR-modified
            effector CD8+ T cells. <em>Journal of Immunology</em>, 2015.
          </li>
        </ul>
        <p className="hint">
          References are given as text rather than links, so the page itself sends no visit to a
          publisher.
        </p>

        <h4>Precision, rounding and engine version</h4>
        <p>
          Nothing is rounded during the calculation.
          Values are rounded once, for display: whole numbers from 100 upward (with thousands
          separators from 10,000), one decimal from 10 to 100, two decimals below that, three
          significant figures below 0.01, and scientific notation from 10<sup>9</sup>. R² is
          shown to four decimals and never as a perfect 1 unless the residual is exactly zero. Slope
          and intercept are shown to three decimals. The CSV keeps full precision and adds a column
          with the figure as displayed.
        </p>
        <p>
          Engine {APP_VERSION}. The version changes whenever the calculation changes, so two results with the same engine version come from the same arithmetic.
        </p>

        <h4>Flags</h4>
        <p>
          Each flag appears in words next to the value it concerns, with what to do. A flag marked &quot;Yes&quot; in the last column stops the figure being reported; the others are reported with the warning beside them. The flags are:
        </p>
        <div className="table-scroll">
        <table>
          <caption className="visually-hidden">Flag legend</caption>
          <thead>
            <tr><th>Flag</th><th>What it means</th><th>What to do</th><th>Stops the figure?</th></tr>
          </thead>
          <tbody>
            <tr><td>A value outside anything a cytometer reports</td><td>A bead MFI or certified value is impossible (beyond full scale, or outside any certificate).</td><td>Not a measurement; correct the typed value.</td><td>Yes</td></tr>
            <tr><td>Standard spans too many decades</td><td>The populations span more than 6 decades of intensity.</td><td>Usually a misplaced exponent, or two standards pasted together; check the MFI column.</td><td>Yes</td></tr>
            <tr><td>Only some populations are off-scale</td><td>A few populations lie outside what a cytometer reports while the rest do not.</td><td>Check those rows for a typing error.</td><td>No</td></tr>
            <tr><td>A population does not agree with the others</td><td>Its certified value divided by its MFI is more than 2.5 times away from the median of the other rows.</td><td>Check that row against the certificate; a value entered against the wrong population, or two rows transposed, is the usual cause.</td><td>No (a note in the bead table)</td></tr>
            <tr><td>Certified values equal the intensities</td><td>Every certified value is the same as its MFI.</td><td>This is not a calibration; enter the certified values from the certificate.</td><td>Yes</td></tr>
            <tr><td>Perfect straight line</td><td>The populations fit with no scatter at all.</td><td>Real beads always scatter; check that the certified values came from the certificate and were not computed from the intensities.</td><td>Yes</td></tr>
            <tr><td>Only three populations</td><td>The fit leaves one degree of freedom.</td><td>Add populations if the kit has them; with three, one wrong value cannot be found.</td><td>No</td></tr>
            <tr><td>Slope departs from 1</td><td>Log-log slope outside 0.85 to 1.15.</td><td>Check detector saturation and compensation on beads and cells.</td><td>No</td></tr>
            <tr><td>Slope is negative</td><td>Brighter beads carry lower certified values.</td><td>Check the values against the certificate.</td><td>Yes</td></tr>
            <tr><td>R² below 0.98</td><td>The line fits the standard poorly.</td><td>Check that each population is gated on the correct peak and none are transposed, then look for a saturated or off-scale population.</td><td>Yes</td></tr>
            <tr><td>Certified values do not increase with MFI</td><td>A brighter population has an equal or lower certified value.</td><td>Usually two rows transposed; check the entries.</td><td>Yes</td></tr>
            <tr><td>Standard is curved</td><td>The standard bends in log-log space.</td><td>Local slopes differ; drop a saturated population or re-acquire.</td><td>No</td></tr>
            <tr><td>Host species mismatch</td><td>The beads capture a different species than your detection antibody.</td><td>These beads cannot calibrate this stain; use a kit whose capture species matches.</td><td>Yes</td></tr>
            <tr><td>Host species recorded as other</td><td>The detection antibody host is "other", so the match with the beads cannot be checked.</td><td>Check the antibody datasheet for its host and the bead kit's datasheet for the species it captures.</td><td>No</td></tr>
            <tr><td>Sample outside calibrated range</td><td>Sample MFI is above or below the beads.</td><td>Do not extrapolate. Add a bead population that brackets the sample, or acquire beads and sample again together at a setting that brings the sample within the beads. Do not dilute the stain to bring it into range: below saturation every ABC is an undercount.</td><td>Yes</td></tr>
            <tr><td>No specific signal</td><td>Control equals or exceeds the sample.</td><td>Check that the right control was used and the tubes were not swapped. A genuinely negative result is a finding: report it as below detection.</td><td>Yes</td></tr>
            <tr><td>Background 25% to 50% of gross density</td><td>The control accounts for a material share of the signal.</td><td>The value is a difference of larger numbers; consider whether an FMO rather than an isotype is the right control for this panel.</td><td>No</td></tr>
            <tr><td>Background 25% or more, control below the beads</td><td>A material share of the result is a control read off the curve below the lowest bead.</td><td>Add a bead population dim enough to bracket the control, or acquire the control within range.</td><td>Yes</td></tr>
            <tr><td>Background 50% to 90% of gross density, control within the beads</td><td>The net value is smaller than the background subtracted to obtain it.</td><td>Confirm the control is right for this panel (an FMO rather than an isotype), and raise specific signal: antibody concentration, fluorophore brightness, whether the target is expressed.</td><td>Yes</td></tr>
            <tr><td>Background 90% or more of gross density</td><td>The sample is not meaningfully above its control.</td><td>Report as below detection under these staining conditions.</td><td>Yes</td></tr>
            <tr><td>Modes diverge</td><td>Density-space and MFI-space subtraction differ by more than 10%.</td><td>State which mode you used.</td><td>No</td></tr>
            <tr><td>Below the lowest bead</td><td>The result is below the lowest standard.</td><td>Say so when you report the value: the curve has not been shown to quantify this dim. Add a dimmer bead population if the kit has one.</td><td>No</td></tr>
            <tr><td>Implausible density</td><td>The result exceeds 2 × 10<sup>7</sup> ABC.</td><td>Usually a mistyped MFI; check the entry.</td><td>Yes</td></tr>
          </tbody>
        </table>
        </div>

        <h3>Why not a spreadsheet?</h3>
        <ul>
          <li>
            <strong>Every assumption is a recorded choice.</strong> Background mode, valency, host
            species, titration, fluorophore:protein ratio and confidence level are declared on the
            page and written into the export, not buried in a cell.
          </li>
          <li>
            <strong>The traps are checked for you.</strong> A transposed bead value, a curve that
            slopes the wrong way, a bend that R² does not reveal, a control brighter than its
            sample and a host species that does not match the capture beads each raise a flag that
            says in words what to check.
          </li>
          <li>
            <strong>Rounding happens once, on display.</strong> The full-precision value is kept
            for the export, so a rounded figure is never fed back into a later step.
          </li>
          <li>
            <strong>A figure that cannot be defended is withheld</strong> rather than printed
            beside a warning that is easy to miss.
          </li>
          <li>
            <strong>The same inputs always give the same output,</strong> and the CSV records the
            settings, the bead lot, the raw inputs, the fit and the version, so the result can be
            reproduced without the page.
          </li>
        </ul>

        <h3>What it does not do</h3>
        <p>
          The tool computes the same result from the same inputs every time, and records the settings, the inputs and the bead lot (where you enter one) in the export. It cannot detect any of the following.
        </p>
        <ul>
          <li>
            <strong>ABC is not equivalent to antigen copy number.</strong> Epitope accessibility,
            binding valency, conjugate performance, and antigen internalisation intervene between
            the two quantities. The inferred site range bounds the sites the antibody
            <em>engaged</em>, and it bounds them from below: an epitope that was masked, already
            occupied, or internalised contributes nothing to the measurement, so the total antigen
            on the cell may exceed the top of that range by any amount.
          </li>
          <li>
            <strong>It cannot tell whether beads and cells were acquired under identical
            conditions.</strong> Detector voltages and optical configuration must be unchanged
            between the two. If they were not, the calibration does not apply, and <em>no output of
            this tool will indicate that</em>. The numbers will look entirely ordinary.
          </li>
          <li>
            <strong>It cannot verify the beads or their lot.</strong> Assigned values are certified
            per manufacturing lot. A fit built from another lot&apos;s certificate looks perfectly
            sound, which is why the lot is recorded in the export.
          </li>
          <li>
            <strong>Sub-saturating antibody undercounts, in one direction.</strong> Unless the
            detection antibody was titrated to saturation on beads and on cells, every reported ABC
            is a lower bound. This is the commonest way the measurement goes wrong at the bench,
            and nothing in the numbers reveals it.
          </li>
          <li>
            <strong>MFI must come from a live, singlet-gated population.</strong> Dead and dying
            cells bind antibody non-specifically and inflate the stained and control channels alike.
            Subtraction does not remove it.
          </li>
          <li>
            <strong>Capture beads bind one host&apos;s immunoglobulin.</strong> Anti-immunoglobulin
            capture reagents cross-react across related hosts to an uncertified degree, so a
            mismatched detection antibody can still produce an ordered, well-fitting curve while the
            beads bind a fraction of what their assigned values assume. The declared host species
            is compared against the kit for this reason.
          </li>
          <li>
            <strong>Density bands are interpretive aids, not validated cutoffs.</strong> CAR
            activation thresholds depend on the construct and on the effector function assessed.
          </li>
          <li>
            <strong>The interval covers the calibration curve, not the sample</strong> (see How it
            works).
          </li>
        </ul>
        <p>
          <strong>Research use only. Not qualified for GxP decision-making.</strong>
        </p>

        <PrivacyPanel />
      </div>
    </section>);
}
