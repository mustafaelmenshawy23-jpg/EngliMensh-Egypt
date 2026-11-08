// Vite copies the imported HTML source documents into dist as separate assets.
// The source HTML files remain unchanged under content-imports/preparatory/.
const htmlAssets = import.meta.glob('/content-imports/preparatory/**/*.html', {
  eager: true,
  query: '?url',
  import: 'default'
});

function assetUrl(fileName) {
  const match = Object.entries(htmlAssets).find(([path]) => path.endsWith('/' + fileName));
  return match?.[1] || null;
}

function sixUnits(filePattern) {
  return Array.from({ length: 6 }, (_, index) => {
    const number = index + 1;
    const fileName = filePattern(number);
    return {
      id: String(number),
      number,
      title: `Unit ${number}`,
      fileName,
      url: assetUrl(fileName),
      format: 'unit'
    };
  });
}

export const preparatoryHtmlRegistry = {
  1: {
    general: {
      series: 'New Hello',
      format: 'interactive-html',
      units: sixUnits((n) => `Prep_1_New_Hello_Unit_${n}.html`)
    },
    advanced: {
      series: 'New Hello Plus',
      format: 'interactive-html',
      units: sixUnits((n) => `Prep_1_New_Hello_Plus_Unit_${n}.html`)
    }
  },
  2: {
    general: {
      series: 'New Hello',
      format: 'static-html',
      units: sixUnits((n) => `Prep_2_New_Hello_Unit_${n}_Complete.html`)
    },
    advanced: {
      series: 'New Hello Plus',
      format: 'interactive-html',
      units: sixUnits((n) => `Prep_2_New_Hello_Plus_Unit_${n}.html`)
    }
  },
  3: {
    general: {
      series: 'New Hello',
      format: 'combined-html',
      units: [
        'Around Town',
        "Let's Go Shopping",
        'My Community',
        'Have You Ever Flown in a Plane?',
        'Life Accomplishments',
        "What's the Matter?"
      ].map((title, index) => ({
        id: String(index + 1),
        number: index + 1,
        title: `Unit ${index + 1}: ${title}`,
        fileName: 'Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html',
        url: assetUrl('Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html'),
        format: 'combined'
      }))
    },
    advanced: {
      series: 'New Hello Plus',
      format: 'interactive-html',
      units: sixUnits((n) => `Prep_3_New_Hello_Plus_Unit_${n}.html`)
    }
  }
};

export function getPreparatoryHtmlCourse(grade, path) {
  const course = preparatoryHtmlRegistry[Number(grade)]?.[path];
  if (!course) return null;
  return {
    ...course,
    units: course.units.filter((unit) => Boolean(unit.url))
  };
}
