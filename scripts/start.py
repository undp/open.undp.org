from generator import ProjectsController
import time

if __name__ == '__main__':

    start = time.time()
    p = ProjectsController()

    p.generate()
    end = time.time()

    print 'Time spent : %s seconds' % (end - start)
