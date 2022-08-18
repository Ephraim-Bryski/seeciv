clearvars
txt='qb=vb*hb,Q=qb*B1,qc=vc*hc,Q=qc*B2,H=hb+vb^2/(2*g),H=hc+vc^2/(2*g),Fr=va/sqrt(g*ha),hb/ha=1/2*(-1+sqrt(1+8*Fr^2)),g=9.81,B1=1,B2=2,Q=3,ha=1,qa=va*ha,Q=qa*B1';
txt='Ks=sqrt(1/(2*n*tanh(k*d))),n=0.5*(1+2*k*d/(sinh(2*k*d))),k=2*pi/L,H/H0=Ks,L=g*T^2/(2*pi)*tanh(k*d),T=1,d=1,H0=3,g=9.81'
% txt='dL1=F*L/(f*A1),A1=pi*D^2/4,dL2=F*L/(f*A2),A2=pi*D^2/4,L=5,f=10,dL1+dL2=dLTot,dLTot=1'
% txt='sav=(sx+100)/2,R=sqrt(((sx-100)/2)^2+T^2),smax=sav+R,smin=sav-R,tan(2*a)=2*T/(sx-100),35=1/2*(smax-smin),sav=(sx+sy)/2,R=sqrt(((sx-sy)/2)^2+T^2),smax=sav+R,smin=sav-R,tan(2*a)=2*T/(sx-sy),Tmax=1/2*(smax-smin)'

% txt='sav=(su+sy)/2,R=sqrt(((su-sy)/2)^2+T^2),smax=sav+R,smin=sav-R,tan(2*a)=2*T/(su-sy),Tmax=1/2*(smax-smin),smax=599778409/5300703,smin=36305951/5300703,a=30*pi/180'
% txt='tan(26714619/25510582)=(-1/28097452294209)*(-120+2*su)^(-1)*sqrt(-2447347158818585053997353781724-3157867301701402389979742724*su^2+378944076204168286797569126880*su)'
% txt='sav=(20+100)/2,R=sqrt(((20-100)/2)^2+35^2),smax=sav+R,smin=sav-R,tan(2*a)=2*35/(20-100),Tmax=1/2*(smax-smin),sav=(sx+sy)/2,R=sqrt(((sx-sy)/2)^2+T^2),smax=sav+R,smin=sav-R,tan(2*30*3.14/180)=2*T/(sx-sy),Tmax=1/2*(smax-smin)'
% txt='sav=(20+100)/2,R=sqrt(((20-100)/2)^2+35^2),smax=sav+R,smin=sav-R,a=2*35/(20-100),Tmax=1/2*(smax-smin),sav=(sx+sy)/2,R=sqrt(((sx-sy)/2)^2+T^2),smax=sav+R,smin=sav-R,30*3.14/180=2*T/(sx-sy),Tmax=1/2*(smax-smin)'
eqns_cell=split(txt,',');
eqn_txt=[]
for i=1:length(eqns_cell)
    eqn_txt=[eqn_txt,'"',eqns_cell{i},'",',newline]
    %eqns_str(i)=string(eqns_cell{i});
end
eqn_txt(end)=[];
disp(eqn_txt)

for i=1:length(eqns_cell)
    eqns(i)=str2sym(eqns_cell{i});
end

sol=solve(eqns)