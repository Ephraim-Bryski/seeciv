%function [node_eqns,bar_eqns]=node_edge(connects1,connects2,bar_eqns,node_eqns)
connects1={'2','3'};
connects2={'3','1'};
bar_eqns=[];
node_eqns=str2sym({'a_==4'});
    % could used for solving trusses and frames, this function has none of
    % the physics (the physics is in the node_eqns and edge_eqns), just
    % code to repeat the eqns over all nodes and edges
    % node eqns would probably be a big sum of forces (and for frames also
    % sum of moments)
    % EQNS SHOULD BE symbolic
    % sum written as &T+F=0  means sum(T)+F=0 and variables MUST BE ONE
    % LETTER
    % edge eqns would only be for frames, about the change in length
    % but it could also be anything else (temp change, settlement etc)
    % connections is an NX2 matrix, each row the indices of the nodes
    % connected by an edge
    % edge eqns would be weird, you might have to write variable names with
    % 1 and 2 at the end to refer to the two nodes (e.g)
    % ((x1+Deltax1)-(x2+Deltax2))^2+((y1+Deltay1)-(y2+Deltaxy))^2-(x1-x2)^2-(y1-y2)^2=DeltaL where the code than
    % pops off the 1 and 2 and understands it refers to the two nodes OR
    % there could be indexing (basically comes down to the same thing)



    SoEs={};
    bar_eqns_expanded=[];
    node_eqns_expanded=[];
    % bar eqns:

    for bar_eqn=bar_eqns
        vars=symvar(bar_eqn);
        for bar_i=1:length(connects1)
%             node1=connects(bar_i,1);
%             node2=connects(bar_i,2);
            bar_eqn_new=bar_eqn;
            for var=vars
                var_with_num=char(var);
                var_n=str2num(var_with_num(end));
                var_txt=var_with_num(1:end-1);
                if ~isempty(var_n)
                    if var_n==1
                        var_new=str2sym([var_txt,'_',connects1{bar_i}]);
                    elseif var_n==2
                        var_new=str2sym([var_txt,'_',connects2{bar_i}]);
                    end
                    if var_n==1 || var_n==2
                        bar_eqn_new=subs(bar_eqn_new,var,var_new);
                    end
                end
            end
            bar_eqns_expanded=[bar_eqns_expanded,bar_eqn_new];
        end
    end


    n_nodes=0;
    connects=[connects1,connects2];
    for i=1:length(connects)
        node_n=str2num(connects{i});
        if node_n>n_nodes
            n_nodes=node_n;
        end
    end

    a=1:n_nodes;

    for node_eqn=node_eqns
        vars=symvar(node_eqn);
        
        
        for node_i=1:n_nodes
            idxs=logical(ismember(connects1,num2str(node_i))+ismember(connects2,num2str(node_i)));
            bar_idxs=a(idxs);
            node_eqn_new=node_eqn;
            for var=vars
                var_char=char(var);
                if var_char(end)=='_'
                    sum_txt=[];
                    for bar_idx=bar_idxs
                        sum_txt=[sum_txt,var_char,num2str(bar_idx),'+'];
                    end
                    sum_txt(end)=[];
                    node_eqn_new=subs(node_eqn_new,var,str2sym(sum_txt));
                end  
            end
            node_eqns_expanded=[node_eqns_expanded,node_eqn_new];
        end
    end

