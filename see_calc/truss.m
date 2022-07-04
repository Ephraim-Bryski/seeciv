% DEPRECATED (NODE_EDGE IS GENERAL FOR ANY STRUCTURE WITH NODES AND EDGES)
% calls optimize
% works correctly when just using solve, but messes up when using optimize
clearvars
joints={0,0;
    2,0;
    4,0;
    6,0;
    8,0;
    10,0;
    1,'y1';
    3,'y2';
    5,'y3';
    7,'y4';
    9,'y5'};
% joints={0,0;
%     2,0;
%     4,0;
%     6,0;
%     8,0;
%     10,0;
%     1,2;
%     3,2;
%     5,2;
%     7,'y4';
%     9,2};
bars=[1,2;
    2,3;
    3,4;
    4,5;
    5,6;
    7,8;
    8,9;
    9,10;
    10,11;
    1,7;
    2,8;
    3,9;
    4,10;
    5,11;
    2,7;
    3,8;
    4,9;
    5,10;
    6,11];
rxns={{1,[1,1]},{6,[0,1]}};
P=-10*10^3;
loads={{2,"y",P},{3,"y",P},{4,"y",P},{5,"y",P}};
other_eqns=["truss_weight=W*truss_length","W=A*rho","rho=2"];
guess=["A=1","y1=2","y2=2","y3=2","y4=2","y5=2"];
% guess=["A=1","y4=10"];


% joints={0,0;
%     2,0;
%     1,"y1"};
% bars=[1,2;
%     1,3;
%     2,3];
% rxns={{1,[1,1]},{2,[0,1]}};
% loads={{3,"y",-10*10^3}};
% other_eqns=["truss_weight=W*truss_length","W=A*rho","rho=1"];
% guess=["A=.01","y1=4"];


var_to_min='truss_weight';


%! need to write function construct array of strings like T<3 should be
%T_1<3 T_2<3 etc
%! would also have to remember which variables are lists
%! would have to go through all the eqns and check if it has a list
%variable





[truss_eqns,L_eqns,L_eqn]=make_truss(joints,bars,rxns,loads);

phys_eqns=["I=pi/4*r^4","A=pi*r^2","E=200*10^9","Fy=350*10^5"];


for i=1:length(bars)
    other_eqns=[other_eqns,string(['stress_',num2str(i),'=T_',num2str(i),'/A'])];
    other_eqns=[other_eqns,string(['stress_',num2str(i),'>=-Fy']),string(['stress_',num2str(i),'<=Fy'])];
end

eqns=str2sym([truss_eqns,L_eqns,L_eqn,other_eqns,phys_eqns]);






sol=my_optimize(eqns,var_to_min,guess);

draw_truss(sol,bars,loads,rxns)



function [eqns,L_eqns,L_eqn]=make_truss(joints,bars,rxns,loads)
    %! It should return an array of equations for the length of each member
    %so you can assign different sections to different bars
    n_joints=length(joints);
    xterms={};
    yterms={};
    for i=1:n_joints
        xterms{i}={};
        yterms{i}={};
    end
    % define terms
    L_eqn=['truss_length='];
    for i=1:length(bars)
        bar=bars(i,:);
        delta_x=['x_',num2str(bar(2)),'-x_',num2str(bar(1))];
        delta_y=['y_',num2str(bar(2)),'-y_',num2str(bar(1))];
        delta=['sqrt((',delta_x,')^2+(',delta_y,')^2)'];
        xterms{bar(1)}{end+1}=['T_',num2str(i),'*(',delta_x,')/',delta];
        xterms{bar(2)}{end+1}=['-T_',num2str(i),'*(',delta_x,')/',delta];
        yterms{bar(1)}{end+1}=['T_',num2str(i),'*(',delta_y,')/',delta];
        yterms{bar(2)}{end+1}=['-T_',num2str(i),'*(',delta_y,')/',delta];
        L_eqns_txt{i}=['length_',num2str(i),'=',delta];
        L_eqn=[L_eqn,'length_',num2str(i),'+'];
    end
    L_eqn(end)=[];
    L_eqn=string(L_eqn)
    
    for i=1:n_joints
        xeqns{i}='0=';
        yeqns{i}='0=';
        for j=1:length(xterms{i})
            xeqns{i}=[xeqns{i},xterms{i}{j},'+'];
            yeqns{i}=[yeqns{i},yterms{i}{j},'+'];
        end
        xeqns{i}(end)=[];
        yeqns{i}(end)=[];
    end

    for i=1:length(rxns)
        rxn=rxns{i};
        joint_idx=rxn{1};
        dir=rxn{2};
        if dir(1)==1
            xeqns{joint_idx}=[xeqns{joint_idx},'+RXN_',num2str(i),'_x'];
        end
        if dir(2)==1
            yeqns{joint_idx}=[yeqns{joint_idx},'+RXN_',num2str(i),'_y'];
        end
    end

    for i=1:length(loads)
        load=loads{i};
        joint_idx=load{1};
        dir=load{2};
        load_name=num2str(load{3});
        if dir=="x"
            xeqns{joint_idx}=[xeqns{joint_idx},'+',load_name];
        elseif dir=="y"
            yeqns{joint_idx}=[yeqns{joint_idx},'+',load_name];
        else
            error('invalid direction')
        end
    end

    

    for i=1:n_joints
        x_loc_eqns{i}=['x_',num2str(i),'=',num2str(joints{i,1})];
        y_loc_eqns{i}=['y_',num2str(i),'=',num2str(joints{i,2})];
    end

    eqns_txt=[xeqns,yeqns,x_loc_eqns,y_loc_eqns];

    for i=1:length(eqns_txt)
        eqn_txt=eqns_txt{i};
        eqns(i)=string(eqn_txt);
    end

    for i=1:length(L_eqns_txt)
        L_eqn_txt=L_eqns_txt{i};
        L_eqns(i)=string(L_eqn_txt);
    end
end











function draw_truss(sol,bars,loads,rxns)
    cla
    hold on

    n_joints=max(max(bars));
    for i=1:n_joints
        joints{i,1}=double(sol.(['x_',num2str(i)]));
        joints{i,2}=double(sol.(['y_',num2str(i)]));
    end

    n_loads=length(loads);
    for i=1:n_loads
        %! if you want length proportional to load, you would need to
        %access sol
        load=loads{i};
        joint_i=load{1};
        x_load=joints{joint_i,1};
        y_load=joints{joint_i,2};
        draw_load(x_load,y_load)
    end

    for i=1:length(rxns)
        rxn=rxns{i};
        joint_i=rxn{1};
        x_joint=joints{joint_i,1};
        y_joint=joints{joint_i,2};
        type=rxn{2};
        if all(type==[1,1])
            draw_pin(x_joint,y_joint)
        else
            draw_roller(x_joint,y_joint)
        end
    end


    for i=1:length(bars)
        bar=bars(i,:);
        plot([joints{bar(1),1},joints{bar(2),1}],[joints{bar(1),2},joints{bar(2),2}],'k')
    end

    for i=1:length(joints)
        scatter(joints{i,1},joints{i,2},'filled','k')
    end

    function draw_pin(x_pos,y_pos)
        width=2;
        plot([x_pos-0.1,x_pos,x_pos+0.1,x_pos-0.1],[y_pos-.1,y_pos,y_pos-.1,y_pos-.1],'k','LineWidth',width)
        
    end

    function draw_roller(x_pos,y_pos)
        width=2;
        r=0.1;
        theta=linspace(0,2*pi,20);
        x=r*cos(theta)+x_pos;
        y=r*sin(theta)+y_pos;
        plot(x,y,'k','LineWidth',width)
    end

    function draw_load(x_pos,y_pos)
        % for now assuming vertical downword force
        arr_length=-0.5;
        width=2;

        plot([x_pos,x_pos],[y_pos,y_pos+arr_length],'b','LineWidth',width)
        plot([x_pos-0.1,x_pos,x_pos+0.1],[y_pos+arr_length+0.1,y_pos+arr_length,y_pos+arr_length+0.1],'b','LineWidth',width)

    end

    axis equal
end

% may make it faster by removing eqns like x=4 and subbing them in, but
% needs to be fixed
% uess_vars=symvar(str2sym(guess));
%     for i=1:length(eqns)
%         eqn=eqns(i);
%         if length(symvar(eqn))==1
%             vars{i}=string(symvar(eqn));
%             sols{i}=solve(eqn);
%         end
%     end
%     vars{end+1}=
% 
%     for i=1:length(vars)
%         eqns=subs(eqns,vars{i},sols{i});
%     end
% 
%     % remove equations which are now like 4=4
%     eqns_cleaned=[];
%     for i=1:length(eqns)
%         if ~isempty(symvar(eqns(i)))
%             eqns_cleaned=[eqns_cleaned,eqns(i)];
%         end
%     end
%     eqns=eqns_cleaned;





























































