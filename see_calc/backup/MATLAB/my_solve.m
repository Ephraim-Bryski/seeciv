function [sol_eqns,error_msg]=my_solve(eqns,solve_var)
    error_msg='';
    %! eqns like a==a returns a==0 instead of an error
    %! for now just returns one solution if there's multiple



    % input symbolic array containing eqns (later also variable to solve
    % for

    % output symbolic array of solutions
    all_sol_eqns=[];
    n_vars=length(symvar(eqns));
    sols=solve(eqns);

    %! with vpasolve it returns matlab errors, but im anyway converting to
    %js so who cares, plus the error messages are better

    if n_vars>length(eqns)
        error_msg='Too many unknowns to solve';
    end

    if ~isstruct(sols)
        if n_vars~=1 || isempty(sols) || ~isempty(symvar(sols))
            error_msg='Cannot solve (single var) ';
        else
            var=char(symvar(eqns));
            all_sol_eqns=str2sym([var,'=',char(sols)]);
        end
    else

        all_vars=fieldnames(sols);
        if isempty(solve_var) % not solving for a variable
            vars=all_vars;
        else
            if ~ismember(all_vars,solve_var)
                error_msg=[solve_var,' is not a variable in the equation'];
                vars={};
            else
                vars={solve_var};
            end
        end

        

        for i=1:length(vars)
            var=vars{i};
            sol=sols.(var);
            if isempty(sol) || ~isempty(symvar(sol))
                error_msg='Cannot solve (multiple vars)';
            else
                sol=sol(1);
                all_sol_eqns=[all_sol_eqns,str2sym([var,'=',num2str(round(double(sol),3))])];
            end
        end
    end



    if isempty(error_msg)
        sol_eqns=all_sol_eqns(1,:) % keeps only one solution
    else
        sol_eqns=[];
    end


