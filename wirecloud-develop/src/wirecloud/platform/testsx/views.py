from django.shortcuts import render_to_response

from django.http import HttpResponse
# Create your views here.

#def hello(request):
#    return HttpResponse("Hello Sixuan")

def year_archive(request, year):
    a_list = Article.objects.filter(pub_date__year=year)
    return render_to_response('wirecloud.platform/testsx/year_archive.html', {'year': year, 'article_list': a_list})