// myFunction.test.js


/*


honestly screw this test framework

*/
const {solve_eqns} = require('../solver.js');

test('basic solve', () => {

  system = ["a+3=4"]
  expected = ["a=1"]
  
  const result = solve_eqns(system);
  expect(result).toStrictEqual(expected);
});


test('basic system solve', () => {
  system = ["a=3","a=b+1"]
  expected = ["a=3","b=2"]

  const result = solve_eqns(system);
  expect(new Set(result)).toStrictEqual(new Set(expected));
});


test('duplicate', () => {
  system = ["a=1","a=1"]
  expected = ["a=1"]

  const result = solve_eqns(system);
  expect(new Set(result)).toStrictEqual(new Set(expected));
});


test('unknown variables', () => {

  system = ["a=b"]
  error_msg = "too many unknowns"

  expect(()=>{solve_eqns(system)} ).toThrowError(error_msg)});


test('contradiction', () => {

  system = ["a=b","b=c+1","a=c"]
  error_msg = "contradiction"

  expect(()=>{solve_eqns(system)} ).toThrowError(error_msg)});


test('infinite sols', () => {

    system = ["a=b","b=c","a=c"]
    error_msg = "infinite solutions"
  
    expect(()=>{solve_eqns(system)} ).toThrowError(error_msg)});



