/*

why im not using it now:

i need to make the solver a module to use it
this means i can't just put it into the html with a script tag and have it interact with the browser
this means i can't then see the Treant trees

i tried using webpack but it didn't really fix the problem

i think once i no longer am using Treant (as much), then i could make the solver a module and use this

*/

const {back_and_forth, arithmetic_check} = require('../my_solver.js');



console.log(back_and_forth)


test("expand out negative", () => {
    expect(back_and_forth("a-(b+c)")).toBe("a-b-c")
});



test("repeated subtraction", () => {
    expect(back_and_forth("a-b-c-d")).toBe("a-b-c-d")
});


test("repeated division", () => {
    expect(back_and_forth("a/b/c/d")).toBe("a/(b*c*d)")
});


test("repeated exponents", () => {
    expect(back_and_forth("a^b^c^d")).toBe("a^b^c^d")
});

test("grouped exponents", () => {
    expect(back_and_forth("(a^b)^(c^d)")).toBe("a^(b*c^d)")
});

test("reduce fraction", () => {
    expect(back_and_forth("6/8")).toBe("3/4")
});

test("multiply fractions", () => {
    expect(back_and_forth("6/8*3/2")).toBe("9/8")
});

test("regroup fractions", () => {
    expect(back_and_forth("(a+(b*c))*(d/f)")).toBe("((a+b*c)*d)/f")
});

test("square root", () => {
    expect(back_and_forth("sqrt(a+b)+c")).toBe("(a+b)^(1/2)+c")
});

test("repeated division and exponents", () => {
    expect(back_and_forth("a*b^c^d/f/(g-2)/h")).toBe("(a*b^c^d)/(f*(g-2)*h)")
});

test("remove 1 exponet", () => {
    expect(back_and_forth("a^1/2")).toBe("a/2")
});


test("move coefficient to front", () => {
    expect(back_and_forth("g*(-3)+4")).toBe("-3*g+4")
});


test("flip negative exponent", () => {
    expect(back_and_forth("a^(-2)")).toBe("1/a^2")
});
