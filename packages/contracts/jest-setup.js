if (typeof expect !== 'undefined' && !expect.addEqualityTesters) {
  expect.addEqualityTesters = function(testers) {
    expect._customTesters = expect._customTesters || [];
    expect._customTesters.push(...testers);
  };
}

jest.setTimeout(60000);
