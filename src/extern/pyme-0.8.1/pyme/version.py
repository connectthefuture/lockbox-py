# $Id: version.py,v 1.10 2008/11/24 21:44:30 belyi Exp $

productname = 'pyme'
versionstr = "0.8.1"
revno = long('$Rev: 281 $'[6:-2])
revstr = "Rev %d" % revno
datestr = '$Date: 2008/11/24 21:44:30 $'

versionlist = versionstr.split(".")
major = versionlist[0]
minor = versionlist[1]
patch = versionlist[2]
copyright = "Copyright (C) 2004,2008 Igor Belyi, 2002 John Goerzen"
author = "Igor Belyi"
author_email = "belyi@users.sourceforge.net"
description = "Python support for GPGME GnuPG cryptography library"
bigcopyright = """%(productname)s %(versionstr)s (%(revstr)s)
%(copyright)s <%(author_email)s>""" % locals()

banner = bigcopyright + """
This software comes with ABSOLUTELY NO WARRANTY; see the file
COPYING for details.  This is free software, and you are welcome
to distribute it under the conditions laid out in COPYING."""

homepage = "http://pyme.sourceforge.net"
license = """Copyright (C) 2004,2008 Igor Belyi <belyi@users.sourceforge.net>
Copyright (C) 2002 John Goerzen <jgoerzen@complete.org>

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307  USA"""
