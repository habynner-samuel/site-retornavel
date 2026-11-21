# Remove só os quadros antigos f036..f047 da pasta site/seq (o giro novo tem 36 quadros).
import sys, os
d = sys.argv[1]
for i in range(36, 48):
    p = os.path.join(d, f'f{i:03d}.webp')
    if os.path.exists(p):
        os.remove(p)
        print('removido', os.path.basename(p))
