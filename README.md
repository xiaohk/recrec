<h1>RecRec <a href="https://poloclub.github.io/recrec/"><picture>

  <source media="(prefers-color-scheme: dark)" srcset="https://i.imgur.com/h9q1Vg6.png">
  <img align="right" alt="RecRec logo." src="https://i.imgur.com/h9q1Vg6.png" height="50">
</picture></a></h1>

[![Github Actions Status](https://github.com/xiaohk/recrec/workflows/build/badge.svg)](https://github.com/xiaohk/recrec/actions/workflows/build.yml)
[![license](https://img.shields.io/badge/License-MIT-blue)](https://github.com/xiaohk/recrec/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/recrec?color=yellow)](https://www.npmjs.com/package/recrec)

Recommender for recommendation letter writers 👍

<a href="https://xiaohk.github.io/recrec"><img width="100%" src='https://i.imgur.com/QaWYWni.png'></a>

## What is RecRec?

RecRec is a practical tool for finding academic recommendation letter writers.
Whether you are preparing for your tenure package, job application, or green card petition, RecRec helps you quickly identify the best letter writers.
RecRec highlights connections between you and potential recommenders and lets you filter by citations, awards, and other criteria.
Save time and get the most impactful recommendations with RecRec!

## How Does RecRec Work?

RecRec uses [Semantic Scholar's](https://www.semanticscholar.org) citation database to analyze and identify all researchers who have cited your papers.
In addition, it uses the [Academic Award database](https://github.com/xiaohk/academic-awards) to highlight researchers with awards, such as ACM Fellow and IEEE Fellow.
Finally, RecRec provides an easy-to-use interface to help you quickly sort, filter, and select potential recommenders.

## Get Started

To use RecRec, visit: <https://xiaohk.github.io/recrec/>.

To find potential recommendation letter writers, follow these three steps:

<table>
  <tr>
    <td><strong>Step 1</strong></td>
    <td>Type your name to identify your semantic scholar profile</td>
  </tr>
  <tr></tr>
  <tr>
    <td><strong>Step 2</strong></td>
    <td>Select your most representative papers</td>
  </tr>
  <tr></tr>
  <tr>
    <td><strong>Step 3</strong></td>
    <td>Browse and filter potential letter writers</td>
  </tr>
  <tr></tr>
  <tr>
    <td><strong>Optional</strong></td>
    <td>Repeat Steps 2 and 3 if needed</td>
  </tr>
  <tr></tr>
  <tr></tr>
</table>

## Developing RecRec

Clone or download this repository:

```bash
git clone git@github.com:xiaohk/recrec.git
```

Install the dependencies:

```bash
npm install
```

Then run RecRec:

```
npm run dev
```

Navigate to localhost:3000. You should see RecRec running in your browser :)

## Credits

RecRec is created by <a href='https://zijie.wang/' target='_blank'>Jay Wang</a>.

<!----

## Citation

To learn more about RecRec and social prompt engineering, check out our [research paper](https://arxiv.org/abs/2401.14447).

```bibtex
@article{wangWordflowSocialPrompt2024,
  title = {Wordflow: {{Social Prompt Engineering}} for {{Large Language Models}}},
  shorttitle = {Wordflow},
  author = {Wang, Zijie J. and Chakravarthy, Aishwarya and Munechika, David and Chau, Duen Horng},
  year = {2024},
  url = {http://arxiv.org/abs/2401.14447},
  urldate = {2024-01-29},
  archiveprefix = {arxiv},
  journal = {arXiv 2401.14447}
}
```

--->

## License

The software is available under the [MIT License](https://github.com/xiaohk/recrec/blob/main/LICENSE).

## Contribution

Feature requests, bug reports, and fixes are all welcome! Start by [opening an issue](https://github.com/xiaohk/recrec/issues/new).

## Contact

If you have any questions, feel free to [open an issue](https://github.com/xiaohk/recrec/issues/new) or contact [Jay Wang](https://zijie.wang).
