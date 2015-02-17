from django.db import models


class Reporter(models.Model):
    full_name = models.CharField(max_length=70)

    # On Python 3: def __str__(self):
    def __unicode__(self):
        return self.full_name

class Article(models.Model):
    pub_date = models.DateField()
    headline = models.CharField(max_length=200)
    content = models.TextField()
    reporter = models.ForeignKey(Reporter)

    # On Python 3: def __str__(self):
    def __unicode__(self):
        return self.headline

